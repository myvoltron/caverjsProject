// test.js
const Caver = require('caver-js');
const caver = new Caver('https://api.baobab.klaytn.net:8651/');
const bip39 = require('bip39');
const { hdkey } = require('ethereumjs-wallet');

async function getSEED() {
    // const mnemonic = bip39.generateMnemonic();
    const mnemonic = 'document tonight company oval hover brother rich hobby pretty library beef connect';
    // console.log(mnemonic);
    if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error(`유효하지 않은 니모닉`);
    }
    const SEED = await bip39.mnemonicToSeed(mnemonic);
    return SEED; // SEED 버퍼를 반환
}

async function getHDWallet(idx) {
    const SEED = await getSEED();
    const hdwallet = hdkey.fromMasterSeed(SEED);
    const path = 'm/0/' + idx;

    const wallet = hdwallet.derivePath(path).getWallet();
    const address = wallet.getAddressString();
    const privateKey = wallet.getPrivateKeyString();

    let response = {
        address,
        privateKey
    };

    return response;
}

// 일반 계정을 RoleBasedKeyAccountWithMultiSig로 업데이트 함
async function convertToRoleBasedKeyAccountWithMultiSig() {
    const { address, privateKey } = await getHDWallet(1);
    const keyring = caver.wallet.keyring.createWithSingleKey(address, privateKey); // 
    caver.wallet.add(keyring); // accountUpdateTx에 서명하기위해 wallet에 키링추가 

    // 업데이트를 위해 새로운 키를 만듬
    const roledBasedKeyArray = caver.wallet.keyring.generateRoleBasedKeys([3, 3, 3]);
    const roleBasedKeyring = caver.wallet.keyring.createWithRoleBasedKey(address, roledBasedKeyArray);
    const weightedMultiSigOptions = [
        new caver.account.weightedMultiSigOptions(2, [1, 1, 1]),
        new caver.account.weightedMultiSigOptions(2, [1, 1, 1]),
        new caver.account.weightedMultiSigOptions(2, [1, 1, 1])
    ];
    console.log(roledBasedKeyArray);

    // 새로운 키링과 옵션으로 account 인스턴스를 만들고
    // accountUpdate 트랜잭션을 만들고 서명 후 전파한다. 
    const account = roleBasedKeyring.toAccount(weightedMultiSigOptions);
    const accountUpdateTransaction = caver.transaction.accountUpdate.create({
        from: address,
        account,
        gas: 300000
    });
    await caver.wallet.sign(address, accountUpdateTransaction);
    caver.rpc.klay.sendRawTransaction(accountUpdateTransaction)
        .on('transactionHash', hash => {
            console.log(hash);
        })
        .on('receipt', receipt => {
            console.log(receipt);
        })
        .on('error', e => {
            console.error(e);
        });
}

// KIP7 토큰을 발행한다. 
async function sendTransactionKIP7() {
    const { address, privateKey } = await getHDWallet(1);
    const roledBasedKeyArray = [
        ['0x0091b0868e9f81b558f34624065ab9247b99b78173fad61817e7b0e7b1ad7d74',
            '0xd8d2b03c52997c45d11ebc42cca212c4d34965a07103842342246fb24a06f8ba',
            '0x29e07c8a57bcbd16cb50845df1114e4831ba52b7193205705c9394a8a13e2d5c'],
        ['0x491fa7018daf1574b7b78a1de35b8d6ca9d9b5cc9755ae6b1d4645351be67fae',
            '0x2b3ae5f715c8d61e12b8fe3ad2242d528bf2daf8087e8230e43c71b781166d8b',
            '0x8640db49c46ab8a825207b47757f7966dac2a008fced5d6b8ffe718805b2d8a6'],
        ['0x619c292e9bf37a3642f53c8dfc48101cb48bdd77948f0da7d0e11fc2e2c4869b',
            '0xce48e9e118cac84119d7c8b3c501caaba538f51d3ca07fcdc4c54e209ab4391b',
            '0xa60fd26ae9754a4ad78e9301bfd555c1ce1aba178ac7e4ff7c085a4b60b6125b']
    ];
    const keyring = caver.wallet.keyring.createWithRoleBasedKey(address, roledBasedKeyArray);
    caver.wallet.add(keyring); // 토큰 전송하는것도 트랜잭션을 통해서 하기 때문에 wallet에 keyring을 추가해야함
    // if (!caver.wallet.isExisted(address)) {
    //     throw new Error(`wallet에 등록되지 않은 주소입니다!`);
    // }




    // 토큰 배포 
    const kip7 = await caver.kct.kip7.deploy({
        name: 'asdf',
        symbol: 'ASDF',
        decimals: 18,
        initialSupply: '100000000000000000000',
    }, address);




    // console.log(`kip7 options: ${JSON.stringify(kip7.options)}`);
    console.log(`Deployed KIP-7 token contract address: ${kip7.options.address}`);
    console.log(`Token name: ${await kip7.name()}`);
    console.log(`Token symbol: ${await kip7.symbol()}`);
    console.log(`Token decimals: ${await kip7.decimals()}`);
    console.log(`Token totalSupply: ${await kip7.totalSupply()}`);
}

// 토큰 보유량 확인
async function getBalanceOfToken(address) {
    kip7 = new caver.kct.kip7('0xaeb170299bF069EcBc3189Ddd0c84a846d6B7062');
    // console.log(`${JSON.stringify(await kip7.detectInterface())}`);
    // console.log(`Token name: ${await kip7.name()}`);
    // console.log(`Token symbol: ${await kip7.symbol()}`);
    // console.log(`Token decimals: ${await kip7.decimals()}`);
    // console.log(`Token totalSupply: ${await kip7.totalSupply()}`);

    const balance = await kip7.balanceOf(address);
    // console.log(`${address}의 토큰 보유량은 ${balance}`);
    return balance;
}


// 토큰 전송
async function transferToken() {
    const { address, privateKey } = await getHDWallet(1);
    const roledBasedKeyArray = [
        ['0x0091b0868e9f81b558f34624065ab9247b99b78173fad61817e7b0e7b1ad7d74',
            '0xd8d2b03c52997c45d11ebc42cca212c4d34965a07103842342246fb24a06f8ba',
            '0x29e07c8a57bcbd16cb50845df1114e4831ba52b7193205705c9394a8a13e2d5c'],
        ['0x491fa7018daf1574b7b78a1de35b8d6ca9d9b5cc9755ae6b1d4645351be67fae',
            '0x2b3ae5f715c8d61e12b8fe3ad2242d528bf2daf8087e8230e43c71b781166d8b',
            '0x8640db49c46ab8a825207b47757f7966dac2a008fced5d6b8ffe718805b2d8a6'],
        ['0x619c292e9bf37a3642f53c8dfc48101cb48bdd77948f0da7d0e11fc2e2c4869b',
            '0xce48e9e118cac84119d7c8b3c501caaba538f51d3ca07fcdc4c54e209ab4391b',
            '0xa60fd26ae9754a4ad78e9301bfd555c1ce1aba178ac7e4ff7c085a4b60b6125b']
    ];
    const keyring = caver.wallet.keyring.createWithRoleBasedKey(address, roledBasedKeyArray); // 역할기반 계정을 wallet에 추가 : 나중에 서명할 때 쓰임
    caver.wallet.add(keyring);

    const tokenAddress = '0xaeb170299bF069EcBc3189Ddd0c84a846d6B7062'; // 토큰 주소 
    const recipient = '0xd758bb2ff06852fda6165191f10791673590e85b'; // 수신자 || 토큰 받는 사람

    kip7 = new caver.kct.kip7(tokenAddress);
    // console.log(`${JSON.stringify(await kip7.detectInterface())}`);
    // console.log(`Token name: ${await kip7.name()}`);
    // console.log(`Token symbol: ${await kip7.symbol()}`);
    // console.log(`Token decimals: ${await kip7.decimals()}`);
    // console.log(`Token totalSupply: ${await kip7.totalSupply()}`);

    // from 추가
    kip7.options.from = address;
    receipt = await kip7.transfer(recipient, 10);
        
    console.log(`영수증 :`, receipt);
    console.log(`보낸 사람의 토큰 보유량 ${await getBalanceOfToken('0x53166a69dcb3934794d459a88bec5d89876d1c34')}`);
    console.log(`받는 사람의 토큰 보유량 ${await getBalanceOfToken('0xd758bb2ff06852fda6165191f10791673590e85b')}`);
}





// HD wallet을 통해 자식 주소와 개인키를 구함
// getHDWallet(2).then(console.log);

// 1
// address = 0x53166a69dcb3934794d459a88bec5d89876d1c34
// privateKey = 0xfe71ad545606eca2e216ef96dabebae17f77a28b7659d2b8cafacecff75305ea

// 2
// address = 0xd758bb2ff06852fda6165191f10791673590e85b
// privateKey = 0xecbfa79cae43084330b99bc973b6c737cd41e00e3919b2376cfe84e1a18fbacc






// 멀티시그를 가진 역할기반 키 계정으로 변환시킴
// convertToRoleBasedKeyAccountWithMultiSig();
/*
키 값들
[
  [
    '0x0091b0868e9f81b558f34624065ab9247b99b78173fad61817e7b0e7b1ad7d74',
    '0xd8d2b03c52997c45d11ebc42cca212c4d34965a07103842342246fb24a06f8ba',
    '0x29e07c8a57bcbd16cb50845df1114e4831ba52b7193205705c9394a8a13e2d5c'
  ],
  [
    '0x491fa7018daf1574b7b78a1de35b8d6ca9d9b5cc9755ae6b1d4645351be67fae',
    '0x2b3ae5f715c8d61e12b8fe3ad2242d528bf2daf8087e8230e43c71b781166d8b',
    '0x8640db49c46ab8a825207b47757f7966dac2a008fced5d6b8ffe718805b2d8a6'
  ],
  [
    '0x619c292e9bf37a3642f53c8dfc48101cb48bdd77948f0da7d0e11fc2e2c4869b',
    '0xce48e9e118cac84119d7c8b3c501caaba538f51d3ca07fcdc4c54e209ab4391b',
    '0xa60fd26ae9754a4ad78e9301bfd555c1ce1aba178ac7e4ff7c085a4b60b6125b'
  ]
]

트랜잭션 해시
0x8fa03d1b6117ec65462aa1ffccf02d5fc9e4fbd5a6f2aaf04fa2d98345638001
*/





// sendTransactionKIP7() 
/*
Deployed KIP-7 token contract address: 0x6b2416b4345e15F7d2918396b64ecE082dadC53b
Token name: hexlant
Token symbol: HEX
Token decimals: 10
Token totalSupply: 100000000000000000000
*/



// 토큰 보유량 확인
// getBalanceOfToken('0x53166a69dcb3934794d459a88bec5d89876d1c34');
// 0x53166a69dcb3934794d459a88bec5d89876d1c34의 토큰 보유량은 100000000000000000000



// 토큰 전송
transferToken();
/*
{
  blockHash: '0x0ee98ff612c517d89c7eb208233415aad21557fefc97997c68ccb5ffd3beb887',
  blockNumber: 88421994,
  contractAddress: null,
  from: '0x53166a69dcb3934794d459a88bec5d89876d1c34',
  gas: '0x183d2',
  gasPrice: '0xae9f7bcc00',
  gasUsed: 88401,
  input: '0xa9059cbb000000000000000000000000d758bb2ff06852fda6165191f10791673590e85b000000000000000000000000000000000000000000000000000000000000000a',
  logsBloom: '0x00000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000040000000000000000000020000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000080000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000400000000000000001000000000000000000000000000000000000000800000000000',
  nonce: '0x6',
  senderTxHash: '0xbfa2a999ff828a70c7f4c3fd9beb659e4d732e6d0701197b214a9e7d74563cb8',
  signatures: [
    {
      V: '0x7f6',
      R: '0x724d86d9fe96306a13e9d438b9bddbe83d5d777489eee047e2b4645d6cdd6c9c',
      S: '0x6ff72f7bffb8d02def2604d0d55564693f077cbe215c86fec3cb7d20dd488e3'
    },
    {
      V: '0x7f5',
      R: '0xe43c6a822ecc7a8b2317720172f09d277c0b0fbe35c87b1d0ed93bf64a6420b7',
      S: '0x832c7d68a57c31631b622ce5ba9465026d0e342f63e7fd6cfdbcd90acd1ba62'
    },
    {
      V: '0x7f6',
      R: '0x690b4b7a03e964958e7c756d52e9179ead04f706e73d6e2b7d806dd5d310d7eb',
      S: '0x3dd9376937ce0b61d5e1183626bbd317eb0c2747f1300a310c99a3962e7b7b64'
    }
  ],
  status: true,
  to: '0xaeb170299bf069ecbc3189ddd0c84a846d6b7062',
  transactionHash: '0xbfa2a999ff828a70c7f4c3fd9beb659e4d732e6d0701197b214a9e7d74563cb8',
  transactionIndex: 0,
  type: 'TxTypeSmartContractExecution',
  typeInt: 48,
  value: '0x0',
  events: {
    Transfer: {
      address: '0xaeb170299bF069EcBc3189Ddd0c84a846d6B7062',
      blockNumber: 88421994,
      transactionHash: '0xbfa2a999ff828a70c7f4c3fd9beb659e4d732e6d0701197b214a9e7d74563cb8',
      transactionIndex: 0,
      blockHash: '0x0ee98ff612c517d89c7eb208233415aad21557fefc97997c68ccb5ffd3beb887',
      logIndex: 0,
      id: 'log_1c54482e',
      returnValues: [Result],
      event: 'Transfer',
      signature: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      raw: [Object]
    }
  }
}
*/