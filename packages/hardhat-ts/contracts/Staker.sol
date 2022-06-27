pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import 'hardhat/console.sol';
import './ExampleExternalContract.sol';

contract Staker {
  ExampleExternalContract public exampleExternalContract;


  //Mappings
  mapping(address => uint256) public balances;
  mapping(address => uint256) public depositTimestamps;

  //Public variables
  uint256 public constant rewardRatePerBlock = 0.1 ether;
  uint256 public withdrawalDeadline = block.timestamp + 120 seconds;
  uint256 public claimDeadline = block.timestamp + 240 seconds;
  uint256 public currentBlock = 0;
  uint256 public constant interestRate =  2;

  //events
  event Stake(address indexed sender, uint256 amount);
  event Received(address, uint);
  event Execute(address indexed sender, uint256 amount);

  //modifiers
  modifier withdrawalDeadLineReached(bool requireReached) {
    uint256 timeRemaining = withdrawalTimeLeft();
    if (requireReached) {
      require(timeRemaining == 0, "Withdrawal period is not reached yet");
    } else {
      require(timeRemaining > 0, "Withdrawal period has been reached");
    }
    _;
  }
 
  modifier claimDeadLineReached(bool requireReached) {
    uint256 timeRemaining = claimPeriodLeft();
    if (requireReached) {
      require(timeRemaining == 0, "Claim deadline is not reached yet");
    } else {
      require(timeRemaining > 0, "Claim deadline has been reached");
    }
    _;
  }

  modifier notCompleted(){
    bool completed = exampleExternalContract.completed();
    require(!completed, "Stake alread completed!");
    _;
  }

  constructor(address exampleExternalContractAddress) {
    exampleExternalContract = ExampleExternalContract(exampleExternalContractAddress);
  }

  function withdrawalTimeLeft() public view returns (uint256 withdrawalTimeLeft){
    if (block.timestamp >= withdrawalDeadline) {
      return 0;
    } 
    return withdrawalDeadline - block.timestamp;
  }

  function claimPeriodLeft() public view returns (uint256 claimPeriodLeft){
    if (block.timestamp >= claimDeadline) {
      return 0;
    }
    return claimDeadline - block.timestamp;
  }

  function stake() public payable withdrawalDeadLineReached(false) claimDeadLineReached(false) {
    balances[msg.sender] = balances[msg.sender] + msg.value;
    depositTimestamps[msg.sender] = block.timestamp;
    emit Stake(msg.sender, msg.value);
  }

  function withdraw() public payable withdrawalDeadLineReached(true) claimDeadLineReached(false) {
    console.log("withdraw");
    console.log(balances[msg.sender]);
    require(balances[msg.sender] > 0, "You have no balance to withdraw");
    uint256 individualBalance = balances[msg.sender];

    uint256 indBalanceReward = individualBalance + calculateInterest(individualBalance, (block.timestamp-depositTimestamps[msg.sender]));
    console.log(indBalanceReward);
    if (indBalanceReward > address(this).balance) {
      //console.log("updating balance address due to insufficient funds");
      indBalanceReward = address(this).balance;
    }
        console.log(indBalanceReward);
    (bool sent, bytes memory data) = msg.sender.call{value: indBalanceReward}("");

    balances[msg.sender] = 0;
    
    require(sent, "RIP; withDrawal failed");
  }

  function calculateInterest(uint256 principal, uint256 period) private view returns(uint256) {
     return principal * (100 + interestRate) ** (period/60); 
  }
 
  // function tempCalculate(address s) public view returns(uint256) {
  //   uint256 individualBalance = balances[s];
  //   console.log("tempCalculate");
  //   console.log(individualBalance);
  //   console.log((block.timestamp-depositTimestamps[s]));
  //   uint256 indBalanceReward = (block.timestamp-depositTimestamps[s]);
  //   return indBalanceReward;
  // }

  function execute() public claimDeadLineReached(true) notCompleted {
    uint256 currentBalance = address(this).balance;
    exampleExternalContract.complete{value: currentBalance}();
  }

  /*
  Time to "kill-time" on our local testnet
  */
  function killTime() public {
    currentBlock = block.timestamp;
  }

  /*
  \Function for our smart contract to receive ETH
  cc: https://docs.soliditylang.org/en/latest/contracts.html#receive-ether-function
  */
  receive() external payable {
      emit Received(msg.sender, msg.value);
  }
 
  // TODO: Collect funds in a payable `stake()` function and track individual `balances` with a mapping:
  //  ( make sure to add a `Stake(address,uint256)` event and emit it for the frontend <List/> display )

  // TODO: After some `deadline` allow anyone to call an `execute()` function
  //  It should call `exampleExternalContract.complete{value: address(this).balance}()` to send all the value

  // TODO: if the `threshold` was not met, allow everyone to call a `withdraw()` function

  // TODO: Add a `timeLeft()` view function that returns the time left before the deadline for the frontend

  // TODO: Add the `receive()` special function that receives eth and calls stake()

}
