const express = require('express');
const cors = require('cors');
const nearAPI = require('near-api-js');
const getConfig = require('../src/config');
const { contract, contractAccount, guestAccount, withNear, hasAccessKey } = require('./middleware/near');
const { contractName, contractMethods, GAS } = getConfig();
const {
	utils: { format: { parseNearAmount } }
} = nearAPI;

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(withNear());

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.post('/has-access-key', hasAccessKey, (req, res) => {
	res.json({ success: true });
});

// WARNING NO RESTRICTION ON THIS ENDPOINT
app.post('/add-guest', async (req, res) => {
	const { account_id, public_key } = req.body;
	try {
        const addKey = await guestAccount.addKey(public_key, contractName, contractMethods.changeMethods, parseNearAmount('0.1'));
		const add_guest = await contract.add_guest({ account_id, public_key }, GAS);
        res.json({ addKey, add_guest });
	} catch(e) {
        console.log(e)
		return res.status(403).send({ error: `key is already added`, e});
	}
});

// WARNING NO RESTRICTION ON THIS ENDPOINT
app.post('/add-key', async (req, res) => {
	const { publicKey } = req.body;
	try {
		res.json(await contractAccount.addAccessKey(publicKey));
	} catch(e) {
		return res.status(403).send({ error: `key is already added`, e});
	}
});

// WARNING NO RESTRICTION ON THIS ENDPOINT
app.get('/delete-access-keys', async (req, res) => {
	const accessKeys = (await contractAccount.getAccessKeys()).filter(({ access_key: { permission }}) => permission && permission.FunctionCall && permission.FunctionCall.receiver_id === contractName);
	try {
		const result = await Promise.all(accessKeys.map(async ({ public_key }) => await contractAccount.deleteKey(public_key)));
		res.json({ success: true, result });
	} catch(e) {
		return res.status(403).send({ error: e.message});
	}
});

// PROTECTED (because user access key must be used to sign request from client)
app.post('/storage-deposit', hasAccessKey, async (req, res) => {
	const { implicitAccountId } = req.body;
	try {
		console.log(contract);
		const storageMinimum = await contract.storage_minimum_balance({});
		console.log(storageMinimum);
		res.json(await contract.storage_deposit({ account_id: implicitAccountId }, GAS, storageMinimum));
	} catch(e) {
		return res.status(403).send({ error: `error registering account`, e});
	}
});

app.listen(port, () => {
	console.log(`\nContract Account ID:\n${contractName}\nListening at http://localhost:${port}`);
});
