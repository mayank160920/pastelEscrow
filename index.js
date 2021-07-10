let web3;
let default_account;
let my_contract;

var nft_address = "0x41a7cf08157c9900689163a4a9930f8684aa58b7";
var contract_address = "0x9B0fbe80Dd30E34a17107764820b80Cd0aFB08fE";

const contract_abi = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_key",
                "type": "uint256"
            }
        ],
        "name": "claim_bid",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "ledger",
        "outputs": [
            {
                "internalType": "bool",
                "name": "status",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "nft_id",
                "type": "uint256"
            },
            {
                "internalType": "address payable",
                "name": "nft_seller",
                "type": "address"
            },
            {
                "internalType": "address payable",
                "name": "nft_buyer",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "weth_expected",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_key",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_nft_id",
                "type": "uint256"
            },
            {
                "internalType": "address payable",
                "name": "_seller",
                "type": "address"
            },
            {
                "internalType": "address payable",
                "name": "_buyer",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "_weth_expected",
                "type": "uint256"
            }
        ],
        "name": "place_bid",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_key",
				"type": "uint256"
			}
		],
		"name": "remove_bid",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]
const nft_abi = [{ "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "approve", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "transferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }]

const loadweb3 = async () => {
    // Modern dapp browsers...
    if (window.ethereum) {
        web3 = new Web3(ethereum);
        try {
            // Request account access if needed
            await ethereum.enable();

            await web3.eth.getAccounts(function (err, accounts) {
                console.log(err, accounts);
                if (!err) {
                    default_account = accounts[0];
                    console.log('Metamask account is: ' + accounts[0]);
                }
            })

        } catch (error) {
            // User denied account access...
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        web3 = new Web3(web3.currentProvider);

        web3.eth.getAccounts(function (err, accounts) {
            console.log(err, accounts);
            default_account = accounts[0];
            if (!err) {
                console.log('Your Metamask account is: ' + accounts[0]);
            }
        })
    }
    // Non-dapp browsers...
    else {
        alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
};

// approve and place bid
const place_bid = async () => {
    // it simply approves nft
    $('#logs-container')[0].innerHTML = ""
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break text-center'><b>Transaction Logs : </b></p>"
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Total 2 Transactions Pending</p>"

    await loadweb3();
    const chainId = await web3.eth.getChainId();

    if (chainId !== 250) {
        Swal.fire('Please Select FTM Network in Your Wallet');
        $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Error : Invalid Network Selected</p>"
        return
    } else {
        console.log(' Right Network :)')
    }

    nft_id = document.getElementById('nft-id').value
    nft_contract = new web3.eth.Contract(nft_abi, nft_address);

    // handle empty price
    if (document.getElementById('nft-price').value == "") {
        $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Error : Incorrect Price</p>"
        Swal.fire("Enter a Valid Price")
    }

    // check buyers address
    try {
        web3.utils.toChecksumAddress(document.getElementById('buyer-address').value);
    } catch (error) {
        $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Error : Incorrect Buyer Address</p>"
        Swal.fire("Invalid Buyer Address")
        return
    }

    // check if user actually owns nft
    try {
        result = await nft_contract.methods.approve(contract_address, nft_id).estimateGas({ from: default_account, value: 0 })
        $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* NFT Ownership Confirmed</p>"
    } catch (error) {
        console.log(error.message)

        error_message = error.message;
        if (error.message.includes('execution reverted: ERC721: approve caller is not owner nor approved for all')) {
            error_message = `Looks like you are not the owner of ${nft_id}`
        }

        Swal.fire({
            icon: 'error',
            title: "Token Approval Failed !",
            text: error_message,
        })
        $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Error : NFT Ownership Not Confirmed</p>"
        return
    }

    // estimating `not transfering` to check if contract already has approval
    try {
        result = await nft_contract.methods.transferFrom(default_account,nft_address, nft_id).estimateGas({ from: contract_address, value: 0 })
        // if no error then no need to approve
        $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction 1 : Already Approved</p>"
        _place_bid()
        return
    } catch (error) {
        console.log(error);
    }

    // lets approve
    txn = nft_contract.methods.approve(contract_address, nft_id).send({ from: default_account, value: 0 });
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction 1 : Nft Approval Txn Sent</p>"
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction 1 : Waiting For Confirmation</p>"

    txn.once('receipt', function (receipt) {
        if (receipt.status == true) {
            console.log("Approval Done :)")
            $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction 1 : Nft Approval Txn Confirmed</p>"
            Swal.fire({
                position: 'top-end',
                icon: 'success',
                title: 'Token Approved',
                showConfirmButton: false,
                timer: 1000
            })
            _place_bid()
        }
    })

    txn.on('error', function (error) {
        if (error.code == 4001) {
            $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction 1 : Transaction Denied By User</p>"
            Swal.fire({
                icon: 'error',
                title: "Transaction Denied !",
                text: error.message,
            })
            return
        }
        console.log(error);
        Swal.fire({
            icon: 'error',
            title: "Transaction Error !",
            text: error.message,
        })
        $('#logs-container')[0].innerHTML += `<p class='my-auto'> Transaction 1 : ${error.message}</p>`
        return
    })


}

const _place_bid = async () => {
    // places the bid
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction 2 : Bid Placement Initiated</p>"

    if (!web3) {
        await loadweb3();
    }
    contract = new web3.eth.Contract(contract_abi, contract_address);

    _key = Math.floor(Math.random() * 100000000000);
    nft_id = document.getElementById('nft-id').value;
    nft_price = web3.utils.toWei(document.getElementById('nft-price').value);
    buyer_address = web3.utils.toChecksumAddress(document.getElementById('buyer-address').value)
    console.log(_key,nft_id,nft_price,buyer_address);

    try {
        await contract.methods.place_bid(_key, nft_id, default_account, buyer_address, nft_price).estimateGas({ from: default_account, value: 0});
    } catch (error) {
        console.log(error.message)
        Swal.fire({
            icon: 'error',
            title: "Bid Placement Failed !",
            text: error.message,
        })
        $('#logs-container')[0].innerHTML += `<p class='my-auto text-break'>* Transaction 2 : ${error.message}</p>`
        return
    }

    txn = contract.methods.place_bid(_key, nft_id, default_account, buyer_address, nft_price).send({ from: default_account, value: 0 });
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction 2 : Bid Placement Txn Sent</p>"
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction 2 : Waiting for Confirmation</p>"
    
    txn.once('receipt', function (receipt) {
        if (receipt.status == true) {
            Swal.fire(`Success ! Your Bid Number is ${_key}`)
            $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction 2 : Bid Placement Txn Confirmed</p>"
            $('#logs-container')[0].innerHTML += `<p class='my-auto text-break'>* Bid Number : ${_key}</p>`
            $('#bid-no')[0].innerHTML = _key
            switch_nav_tab('bid-no');
        }
    })
    txn.on('error', function (error) {
        if (error.code == 4001) {
            Swal.fire({
                icon: 'error',
                title: "Transaction Denied !",
                text: error.message,
            })
            $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction 2 : Bid Placement Txn Failed</p>"
            return
        }
        console.log(error);
        Swal.fire({
            icon: 'error',
            title: "Transaction Error !",
            text: error.message,
        })
        return
    })
}

// claim and search bid
const fetchbid = async () => {
    if (!web3) {
        await loadweb3();
    }
    _key = document.getElementById('bid-number').value
    contract = new web3.eth.Contract(contract_abi, contract_address);
    txn = await contract.methods.ledger(_key).call();
    console.log(txn);

    if (!txn.status) {
        Swal.fire('Incorrect Bid Number');
        element.classList.add('d-none')
    } else {
        $('#show-bid-bid-no')[0].innerHTML = _key
        $('#show-bid-nft-id')[0].innerHTML = txn.nft_id
        $('#show-bid-seller')[0].innerHTML = txn.nft_seller
        $('#show-bid-buyer')[0].innerHTML = txn.nft_buyer
        $('#show-bid-bid-price')[0].innerHTML = `${Web3.utils.fromWei(txn.weth_expected)} FTM`
    
        element = document.getElementById('show-bid-container');
        while (element.classList.contains('d-none')) {
            element.classList.remove('d-none')
        }
    }
}

const claimbid = async () => {
    $('#logs-container')[0].innerHTML = ""
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break text-center'><b>Transaction Logs : </b></p>"
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Total 1 Transaction Pending</p>"

    if (!web3) {
        await loadweb3();
    }

    _key = $('#show-bid-bid-no')[0].innerHTML   // from the current bid which is shown
    $('#logs-container')[0].innerHTML += `<p class='my-auto text-break'>* Attempting to Claim Bid : ${_key}</p>`

    contract = new web3.eth.Contract(contract_abi, contract_address);
    txn = await contract.methods.ledger(_key).call();
    _price = txn.weth_expected ;

    try {
        result = await contract.methods.claim_bid(_key).estimateGas({ from: default_account, value: _price});
    } catch (error) {
        console.log(error.message)

        error_message = error.message;
        if (error.message.includes('execution reverted: Wrong Buyer')) {
            error_message = `Your Address and Buyer Address Does Not Match`
        }

        $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Error : Unable to send transaction</p>"
        $('#logs-container')[0].innerHTML += `<p class='my-auto text-break'> ${error_message}</p>`
        Swal.fire({
            icon: 'error',
            title: "Error !",
            text: error_message,
        })
        return
    }

    txn = contract.methods.claim_bid(_key).send({ from: default_account, value: _price});
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction Sent !</p>"
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Waiting For Confirmation...</p>"

    txn.once('receipt', function (receipt) {
        if (receipt.status == true) {
            $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction Confirmed :)</p>"
            console.log("Bid Claimed :)")
            Swal.fire({
                position: 'top-end',
                icon: 'success',
                title: 'Bid Claimed',
                showConfirmButton: false,
                timer: 1000
            })
        }
    })

    txn.on('error', function (error) {
        if (error.code == 4001) {
            $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction Denied By User</p>"
            Swal.fire({
                icon: 'error',
                title: "Transaction Denied !",
                text: error.message,
            })
            return
        }
        console.log(error);
        Swal.fire({
            icon: 'error',
            title: "Transaction Error !",
            text: error.message,
        })
        $('#logs-container')[0].innerHTML += `<p class='my-auto'> Transaction 1 : ${error.message}</p>`
        return
    })
}

// remove bid
const removebid = async () => {
    $('#logs-container')[0].innerHTML = ""
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break text-center'><b>Transaction Logs : </b></p>"
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Total 1 Transaction Pending</p>"

    if (!web3) {
        await loadweb3();
    }

    _key = document.getElementById('remove-bid-number').value   // from the input field
    $('#logs-container')[0].innerHTML += `<p class='my-auto text-break'>* Attempting to Remove Bid : ${_key}</p>`

    contract = new web3.eth.Contract(contract_abi, contract_address);

    try {
        result = await contract.methods.remove_bid(_key).estimateGas({ from: default_account, value: 0});
    } catch (error) {
        console.log(error.message)
        error_message = error.message;
        if (error.message.includes('execution reverted: Invalid Key')) {
            error_message = "Bid Number is Invalid"
        } else if (error.message.includes('execution reverted: Transaction Issuer and Buyer Address Mismatch')) {
            error_message = "Transaction Issuer and Buyer Address Mismatch"
        }
        
        Swal.fire({icon: 'error',title: "ERROR !",text: error_message})
        $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Error : Unable to send transaction</p>"
        $('#logs-container')[0].innerHTML += `<p class='my-auto text-break'>* ${error_message}</p>`
        return
    }

    txn = contract.methods.remove_bid(_key).send({ from: default_account, value: 0});
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction Sent !</p>"
    $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Waiting For Confirmation...</p>"

    txn.once('receipt', function (receipt) {
        if (receipt.status == true) {
            $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction Confirmed :)</p>"
            console.log("Bid Removed :)")
            Swal.fire({
                position: 'top-end',
                icon: 'success',
                title: 'Bid Removed',
                showConfirmButton: false,
                timer: 1000
            })
        }
    })

    txn.on('error', function (error) {
        if (error.code == 4001) {
            $('#logs-container')[0].innerHTML += "<p class='my-auto text-break'>* Transaction Denied By User</p>"
            Swal.fire({
                icon: 'error',
                title: "Transaction Denied !",
                text: error.message,
            })
            return
        }
        console.log(error);
        Swal.fire({
            icon: 'error',
            title: "Transaction Error !",
            text: error.message,
        })
        $('#logs-container')[0].innerHTML += `<p class='my-auto'>  ${error.message}</p>`
        return
    })
}

function switch_nav_tab(identifier) {
    var container_list = ['place-bid-container', 'claim-bid-container', 'remove-bid-container','bid-no-container','show-bid-container']
    var button_list = ['place-bid-button', 'claim-bid-button', 'remove-bid-button']
    var container = identifier + "-container"
    var button = identifier + "-button"

    for (_button of button_list) {
        if (_button == button) {
            element = document.getElementById(_button);
            if (!element.classList.contains('active')) {
                element.classList.add('active');
            }
        } else {
            element = document.getElementById(_button)
            while (element.classList.contains('active')) {
                element.classList.remove('active')
            }
        }
    }

    for (_container of container_list) {
        if (_container == container) {
            element = document.getElementById(_container);
            while (element.classList.contains('d-none')) {
                element.classList.remove('d-none')
            }
        } else {
            element = document.getElementById(_container)
            if (!element.classList.contains('d-none')) {
                element.classList.add('d-none');
            }
        }
    }

    $('#logs-container')[0].innerHTML = ""
}

