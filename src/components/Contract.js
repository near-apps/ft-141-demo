import React, { useEffect, useState } from 'react';
import * as nearAPI from 'near-api-js';
import { GAS, parseNearAmount } from '../state/near';
import {
	contractName,
	createAccessKeyAccount,
	getContract,
} from '../utils/near-utils';

const {
	KeyPair,
	utils: { format: { formatNearAmount } }
} = nearAPI;

export const Contract = ({ near, update, localKeys = {}, account, tokenBalance }) => {

	const [registered, setRegistered] = useState(false);
	const [amount, setAmount] = useState('');
	const [receiver, setReceiver] = useState('');
	const [transferAmount, setTransferAmount] = useState('');

	useEffect(() => {
		if (!account) return;
		loadWalletBalances();
	}, []);
	const loadWalletBalances = async () => {
		const contract = getContract(account);
		const storageBalance = await contract.storage_balance_of({ account_id: account.accountId });
		// console.log('token storage wallet:', storageBalance);
		setRegistered(storageBalance.total !== '0');
		const tokenBalance = await contract.ft_balance_of({ account_id: account.accountId });
		update('tokenBalance', tokenBalance);
	};

	useEffect(() => {
		if (!localKeys.accessPublic) return;
	}, [localKeys.accessPublic]);

	const handleRegister = async () => {
		const contract = getContract(account);
		update('loading', true);
		const storageMinimum = await contract.storage_minimum_balance({});
		try {
			if (registered) {
				await contract.storage_withdraw({ amount: storageMinimum }, GAS, 1);
			} else {
				await contract.storage_deposit({}, GAS, storageMinimum);
			}
		} catch (e) {
			console.warn(e);
		}
		update('loading', false);
	};

	const handleBuyTokens = async () => {
		if (!amount.length) {
			alert('Please enter amount!');
			return;
		}
		update('loading', true);
		// const appAccount = createAccessKeyAccount(near, KeyPair.fromString(localKeys.accessSecret));
		const contract = getContract(account);
		try {
			await contract.near_deposit({}, GAS, parseNearAmount(amount));
		} catch (e) {
			console.warn(e);
		}
		update('loading', false);
	};

	const handleTransferTokens = async () => {
		if (!transferAmount.length || !receiver.length) {
			alert('Please enter amount and receiver!');
			return;
		}
		update('loading', true);
		// const appAccount = createAccessKeyAccount(near, KeyPair.fromString(localKeys.accessSecret));
		const contract = getContract(account);
		try {
			await contract[receiver === contractName ? 'ft_transfer_call' : 'ft_transfer']({
				receiver_id: receiver,
				amount: parseNearAmount(transferAmount),
				msg: ''
			}, GAS, 1);
		} catch (e) {
			console.warn(e);
		}
		update('loading', false);
	};

	const handleWithdrawTokens = async () => {
		if (!transferAmount.length || !receiver.length) {
			alert('Please enter amount and receiver!');
			return;
		}
		update('loading', true);
		// const appAccount = createAccessKeyAccount(near, KeyPair.fromString(localKeys.accessSecret));
		const contract = getContract(account);
		try {
			await contract[receiver === contractName ? 'ft_transfer_call' : 'ft_transfer']({
				receiver_id: receiver,
				amount: parseNearAmount(transferAmount),
				msg: ''
			}, GAS, 1);
		} catch (e) {
			console.warn(e);
		}
		update('loading', false);
	};

	return <>
		{
			/// wallet is signed in
			account &&
            <>
            	<h2>2. Buy Wrapped NEAR</h2>
            	<p>Token Contract is {contractName}</p>
            	{ !registered && <p>Register with the token contract so you can buy tokens and store your balance (note: this will soon go away with NEAR Wallet sign in + deposit)</p>}
            	{
            		tokenBalance === '0' &&
                    <button onClick={() => handleRegister()}>{registered ? 'Unregister' : 'Register'}</button>
            	}
            	{
            		registered && <>
            			{
            				tokenBalance === '0' &&
                            <span>By unregistering you won't be able to buy wrapped NEAR</span>
            			}
            			<br />
            			<input placeholder="Amount (N)" value={amount} onChange={(e) => setAmount(e.target.value)} />
            			<br />
            			<button onClick={() => handleBuyTokens()}>Buy Tokens</button>
            		</>
            	}

            	{
            		tokenBalance !== '0' && <>
            			<h2>3. Transfer Wrapped NEAR</h2>
            			<button onClick={() => handleWithdrawTokens()}>Withdraw Tokens</button>
            			<p>Token Balance: {formatNearAmount(tokenBalance, 2)}</p>
            			<input placeholder="Transfer Amount (N)" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} />
            			<input placeholder="Receiver Account Id" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
            			<br />
            			<button onClick={() => handleTransferTokens()}>Transfer Tokens</button>
            		</>
            	}
            </>
		}

	</>;
};

