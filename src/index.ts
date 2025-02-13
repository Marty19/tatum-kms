#!/usr/bin/env node
import {generateWallet} from '@tatumio/tatum';
import axios from 'axios';
import {
    exportWallets,
    getAddress,
    getPrivateKey,
    getWallet,
    removeWallet,
    storePrivateKey,
    storeWallet
} from './management';
import {processSignatures} from './signatures';

const meow = require('meow');
const {question} = require('readline-sync');

const {input: command, flags} = meow(`
    Usage
        $ tatum-kms command

    Commands
        daemon                            Run as a daemon, which periodically checks for a new transactions to sign.
        generatewallet <chain>            Generate wallet for a specific blockchain and echo it to the output.
        generatemanagedwallet <chain>     Generate wallet for a specific blockchain and add it to the managed wallets.
        storemanagedwallet <chain>        Store mnemonic-based wallet for a specific blockchain and add it to the managed wallets.
        storemanagedprivatekey <chain>    Store private key of a specific blockchain and add it to the managed wallets.
        getprivatekey <signatureId> <i>   Obtain managed wallet from wallet store and generate private key for given derivation index.
        getaddress <signatureId> <i>      Obtain managed wallet from wallet store and generate address for given derivation index.
        getmanagedwallet <signatureId>    Obtain managed wallet / private key from wallet store.
        removewallet <signatureId>        Remove managed wallet from wallet store.
        export                            Export all managed wallets.

    Options
        --api-key                         Tatum API Key to communicate with Tatum API. Daemon mode only.
        --testnet                         Indicates testnet version of blockchain. Mainnet by default.
        --path                            Custom path to wallet store file.
        --period                          Period in seconds to check for new transactions to sign, defaults to 5 seconds. Daemon mode only.
        --chain                           Blockchains to check, separated by comma. Daemon mode only.
	    --vgs                             Using VGS (https://verygoodsecurity.com) as a secure storage of the password which unlocks the wallet file. 
	    --azure                           Using Azure Vault (https://azure.microsoft.com/en-us/services/key-vault/) as a secure storage of the password which unlocks the wallet file.   
`, {
    flags: {
        path: {
            type: 'string',
        },
        chain: {
            type: 'string',
        },
        'api-key': {
            type: 'string',
        },
        testnet: {
            type: 'boolean',
            isRequired: true,
        },
        vgs: {
            type: 'boolean',
        },
        azure: {
            type: 'boolean',
        },
        period: {
            type: 'number',
            default: 5,
        }
    }
});

const startup = async () => {
    if (command.length === 0) {
        return;
    }
    switch (command[0]) {
        case 'daemon':
            let pwd = '';
            process.env.TATUM_API_KEY = flags.apiKey;
            await processSignatures(pwd, flags.testnet, flags.period, flags.path, flags.chain?.split(','));
            break;
        case 'generatewallet':
            console.log(JSON.stringify(await generateWallet(command[1], flags.testnet), null, 2));
            break;
        case 'export':
            exportWallets('', flags.path);
            break;
        case 'generatemanagedwallet':
            await storeWallet(command[1], flags.testnet,'', flags.path);
            break;
        case 'storemanagedwallet':
            await storeWallet(command[1], flags.testnet,'', flags.path, question('Enter mnemonic to store:', {
                    hideEchoBack: true,
                }));
            break;
        case 'storemanagedprivatekey':
            await storePrivateKey(command[1], flags.testnet,'', question('Enter private key to store:', {
                    hideEchoBack: true,
                }), flags.path);
            break;
        case 'getmanagedwallet':
            await getWallet(command[1],'', flags.path);
            break;
        case 'getprivatekey':
            await getPrivateKey(command[1], command[2],'', flags.path);
            break;
        case 'getaddress':
            await getAddress(command[1], command[2],'', flags.path);
            break;
        case 'removewallet':
            await removeWallet(command[1],'', flags.path);
            break;
        default:
            console.error('Unsupported command. Use tatum-kms --help for details.');
            process.exit(-1);
    }
};

startup();
