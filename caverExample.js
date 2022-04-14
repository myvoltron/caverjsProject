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
// address = 0x0x53166a69dcb3934794d459a88bec5d89876d1c34
// privateKey = 0xfe71ad545606eca2e216ef96dabebae17f77a28b7659d2b8cafacecff75305ea
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

// KIP7 토큰을 전파한다. 
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
    const keyring = caver.wallet.keyring.createWithRoleBasedKey(address, roledBasedKeyArray); // 역할기반 계정을 wallet에 추가 : 나중에 서명할 때 쓰임
    caver.wallet.add(keyring);
    // if (!caver.wallet.isExisted(address)) {
    //     throw new Error(`wallet에 등록되지 않은 주소입니다!`);
    // }

    // 토큰 배포 
    const kip7 = await caver.kct.kip7.deploy({
        name: 'hexlant',
        symbol: 'HEX',
        decimals: 10,
        initialSupply: '100000000000000000000',
    }, address);

    console.log(`Deployed KIP-7 token contract address: ${kip7.options.address}`);

    console.log(`Token name: ${await kip7.name()}`);
    console.log(`Token symbol: ${await kip7.symbol()}`);
    console.log(`Token decimals: ${await kip7.decimals()}`);
    console.log(`Token totalSupply: ${await kip7.totalSupply()}`);
}

// HD wallet을 통해 자식 주소와 개인키를 구함
// getHDWallet(1).then(console.log);




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





sendTransactionKIP7();
/*
Deployed KIP-7 token contract address: 0x6b2416b4345e15F7d2918396b64ecE082dadC53b
Token name: hexlant
Token symbol: HEX
Token decimals: 10
Token totalSupply: 100000000000000000000
*/