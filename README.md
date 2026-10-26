# This is a Food Delivery system
This system is trying to use blockchain to build.

A decentralized food delivery DApp built for YTP 2020: customers place food
orders and delivery people pick up and hand over orders through an Ethereum
smart contract, with MetaMask in the browser.

## Repository layout

- `contract/` – Solidity contract (`YTP.sol`), compiled bytecode and ABI.
- `Static-master/` – the web front end (Bootstrap 4, jQuery, web3.js 1.x, SweetAlert2).
  - `index.html` – landing page (connect MetaMask or continue as a guest).
  - `works/index.html` – food list, ordering and delivery pages.
  - `js/config.js` – contract address, ABI path and API keys.
  - `get.py` – scrapes food items into `food.json` (`pip install requests beautifulsoup4`).

## Running the front end

The pages use absolute paths such as `/js/works.js`, so serve `Static-master/`
as the web root:

```
cd Static-master
python3 -m http.server 8000
```

Then open http://localhost:8000 with MetaMask installed.

> The contract was deployed on the Ropsten testnet, which has since been shut
> down. To use the app today, deploy the contract to another network and update
> `contractAddress`, the Infura endpoint and the Etherscan links.
