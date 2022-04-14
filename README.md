# caverjsProject

klaytn SDK인 caver-js로 다양한 것을 만들어 봄
- bip39 패키지로 니모닉을 생성하고 SEED를 만들 수 있었음
- ethereumjs-wallet의 hdkey를 사용해서 hdwallet을 만들 수 있었다.
    - hdwallet에서 다양한 자식 주소 또는 자식 키들을 파생시킬 수 있었다. 
- 그리고 일반적으로 개인키 하나를 사용하는 account를 multiSig 기반의 roleBasedKey를 사용하는 account로 update할 수 있었다. 
    - 우선 역할이 3개가 있는데 각 역할마다 다수의 랜덤한 키를 생성해준다. 
    ```javascript
    const roledBasedKeyArray = caver.wallet.keyring.generateRoleBasedKeys([3, 3, 3]);
    ```
    - 업데이트를 하기 위해 account 인스턴스를 만들어야 하는데 이를 keyring으로부터 만들 수 있다. 그러므로 keyring부터 만들어 보자 
    ```javascript
    const roleBasedKeyring = caver.wallet.keyring.createWithRoleBasedKey(address, roledBasedKeyArray);
    ```
    - keyring 인스턴스에 toAccount() 라는 메서드가 있는데 여기에 weightedMultiSigOptions를 넣어서 weightedMultiSig 기반의 RoleBasedKeyAccount를 만들 수 있다. 
    ```javascript
    const weightedMultiSigOptions = [
        new caver.account.weightedMultiSigOptions(2, [1, 1, 1]),
        new caver.account.weightedMultiSigOptions(2, [1, 1, 1]),
        new caver.account.weightedMultiSigOptions(2, [1, 1, 1])
    ];
    const account = roleBasedKeyring.toAccount(weightedMultiSigOptions);
    ```
    - 이후 accountUpdate 트랜잭션을 만들고 위에서 wallet에 등록해둔 keyring을 통해 서명을 할 수 있다. 그리고 전파하면 계정 업데이트를 할 수 있다. 
- KIP7 기반의 토큰을 전파할 수 있었다. 
    - 위에서 만든 weightedMultiSig 기반의 RoleBasedKeyring을 wallet에 등록을 하고 caver.kct.kip7.deploy 메서드를 사용할 수 있었다. *keyring을 wallet에 등록안하면 아마 서명을 못하니까 안될듯*     

### 바오밥 스코프에서 트랜잭션 확인해보기
https://baobab.scope.klaytn.com/account/0x53166a69dcb3934794d459a88bec5d89876d1c34?tabId=txList
https://baobab.scope.klaytn.com/account/0x6b2416b4345e15F7d2918396b64ecE082dadC53b?tabId=internalTx