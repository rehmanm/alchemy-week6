import {
  EtherscanProvider,
  StaticJsonRpcProvider
} from '@ethersproject/providers';
import {
  formatEther,
  parseEther
} from '@ethersproject/units';

import {
  Button,
  Divider,
  List
} from 'antd';
import {
  Address,
  Balance
} from 'eth-components/ant';
import {
  transactor,
  TTransactor
} from 'eth-components/functions';
import { EthComponentsSettingsContext } from 'eth-components/models';
import {
  useBalance,
  useContractLoader,
  useEventListener,
  useGasPrice,
  useOnRepetition
} from 'eth-hooks';
import { useEthersContext } from 'eth-hooks/context';
import { useDexEthPrice } from 'eth-hooks/dapps';
import {
  BigNumber,
  ethers
} from 'ethers';
import {
  HumanizeDuration,
  HumanizeDurationLanguage
} from 'humanize-duration-ts';
import React, {
  FC,
  useContext,
  useEffect,
  useState
} from 'react';
import {
  ExampleExternalContract,
  Staker as StakerContract
} from '~~/generated/contract-types';

import { useAppContracts } from '../hooks/useAppContracts';

const langService: HumanizeDurationLanguage = new HumanizeDurationLanguage();
const humanizer: HumanizeDuration = new HumanizeDuration(langService);

export interface StakerProps {
  mainnetProvider: StaticJsonRpcProvider;
}

export const Staker: FC<StakerProps> = (props) => {
  const { mainnetProvider } = props;

  const appContractConfig = useAppContracts();
  const ethersContext = useEthersContext();
  const readContracts = useContractLoader(appContractConfig);
  const writeContracts = useContractLoader(appContractConfig, ethersContext?.signer);

  const yourCurrentBalance = useBalance(ethersContext.account ?? '');

  const stakeContractRead = readContracts['Staker'] as StakerContract;
  const stakeContractWrite = writeContracts['Staker'] as StakerContract;
  const externalContractRead = readContracts['ExampleExternalContract'] as ExampleExternalContract;

  const ethComponentsSettings = useContext(EthComponentsSettingsContext);
  const gasPrice = useGasPrice(ethersContext.chainId, 'fast');
  const ethPrice = useDexEthPrice(mainnetProvider);
  const tx = transactor(ethComponentsSettings, ethersContext?.signer, gasPrice);

  const [stackEther, setStackEther] = useState('0.5');

  // const [threshold, setThreshold] = useState<BigNumber>();
  // useEffect(() => {
  //   const getThreshold = async () => {
  //     const threshold = await stakeContractRead?.threshold();
  //     console.log('💵 threshold:', threshold);
  //     setThreshold(threshold);
  //   };
  //   getThreshold();
  // }, [yourCurrentBalance]);

  // const [timeLeft, setTimeLeft] = useState<BigNumber>();
  // useEffect(() => {
  //   const getTimeLeft = async () => {
  //     const timeLeft = await stakeContractRead?.timeLeft();
  //     console.log('⏳ timeLeft:', timeLeft);
  //     setTimeLeft(timeLeft);
  //   };
  //   getTimeLeft();
  // }, [yourCurrentBalance]);

  const [balanceStaked, setBalanceStaked] = useState<BigNumber>();
  useEffect(() => {
    const getBalanceStaked = async () => {
      const balanceStaked = await stakeContractRead?.balances(ethersContext?.account ?? '');
      console.log('💵 balanceStaked:', balanceStaked);
      setBalanceStaked(balanceStaked);
    };
    getBalanceStaked();
  }, [yourCurrentBalance]);

  const [completed, setCompleted] = useState<boolean>(false);
  useEffect(() => {
    const getCompleted = async () => {
      const completed = await externalContractRead?.completed();
      console.log('✅ complete:', completed);
      setCompleted(completed);
    };
    getCompleted();
  }, [yourCurrentBalance]);

  const [rewardRatePerBlock, setRewardRatePerBlock] = useState<BigNumber>();
  useEffect(() => {
    const getRewardRatePerBlock = async () => {
      const rewardRatePerBlock = await stakeContractRead?.rewardRatePerBlock();
      console.log('💵 rewardRatePerBlock:', rewardRatePerBlock);
      setRewardRatePerBlock(rewardRatePerBlock);
    };
    getRewardRatePerBlock();
  }, [yourCurrentBalance]);

  const [claimPeriodLeft, setClaimPeriodLeft] = useState<BigNumber>();
  useEffect(() => {
    const getClaimPeriodLeft = async () => {
      const claimPeriodLeft = await stakeContractRead?.claimPeriodLeft();
      console.log('💵 claimPeriodLeft:', claimPeriodLeft);
      setClaimPeriodLeft(claimPeriodLeft);
    };
    getClaimPeriodLeft();
  }, [yourCurrentBalance]);

  const [withdrawalTimeLeft, setWithdrawalTimeLeft] = useState<BigNumber>();
  useEffect(() => {
    const getWithdrawalTimeLeft = async () => {
      const withdrawalTimeLeft = await stakeContractRead?.withdrawalTimeLeft();
      console.log('💵 claimPeriodLeft:', withdrawalTimeLeft);
      setWithdrawalTimeLeft(withdrawalTimeLeft);
    };
    getWithdrawalTimeLeft();
  }, [yourCurrentBalance]);

  const [interestRate, setInterestRate] = useState<BigNumber>();
  useEffect(() => {
    const getInterestRate = async () => {
      const interestRate = await stakeContractRead?.interestRate();
      console.log('💵 interestRate:', interestRate);
      setInterestRate(interestRate);
    };
    getInterestRate();
  }, [yourCurrentBalance]);

  interestRate;

  // ** 📟 Listen for broadcast events
  const stakeEvents = useEventListener(stakeContractRead, 'Stake', 1);

  let completeDisplay = <></>;
  if (completed) {
    completeDisplay = (
      <div style={{ padding: 64, backgroundColor: '#eeffef', fontWeight: 'bolder' }}>
        🚀 🎖 👩‍🚀 - Staking App triggered `ExampleExternalContract` -- 🎉 🍾 🎊
        <Balance address={externalContractRead?.address} /> ETH staked!
      </div>
    );
  }
  return (
    <div>
      {completeDisplay}

      <div style={{ padding: 8, marginTop: 32 }}>
        <div>Staker Contract:</div>
        <Address address={stakeContractRead?.address} />
      </div>
      <Divider />

      <div style={{ padding: 8, marginTop: 16 }}>
        <div>Reward Rate Per Second:</div>
        <Balance balance={rewardRatePerBlock} fontSize={64} /> ETH
      </div>
      <Divider />

      <div style={{ padding: 8, marginTop: 16 }}>
        <div>Interest Rate: </div>
        {interestRate && interestRate.toNumber()}%
      </div>
      <Divider />

      <div style={{ padding: 8, marginTop: 16 }}>
        <div>Claim Period Left:</div>
        {claimPeriodLeft && humanizer.humanize(claimPeriodLeft.toNumber() * 1000)}
      </div>
      <div style={{ padding: 8, marginTop: 16 }}>
        <div>Withdrawal Period Left:</div>
        {withdrawalTimeLeft && humanizer.humanize(withdrawalTimeLeft.toNumber() * 1000)}
      </div>

      <Divider />
      <div style={{ padding: 8, fontWeight: 'bold' }}>
        <div>Total Available ETH in Contract:</div>
        <Balance address={stakeContractRead?.address} />
      </div>

      <Divider />

      <div style={{ padding: 8, fontWeight: 'bold' }}>
        <div>ETH Locked 🔒 in Staker Contract:</div>
        <Balance balance={balanceStaked} fontSize={64} price={ethPrice} />
      </div>
      {/* 
      <div style={{ padding: 8, marginTop: 32 }}>
        <div>Timeleft:</div>
        {timeLeft && humanizer.humanize(timeLeft.toNumber() * 1000)}
      </div>

      <div style={{ padding: 8 }}>
        <div>Total staked:</div>
        <Balance address={stakeContractRead?.address} />/
        <Balance address={undefined} balance={threshold} />
      </div>

      <div style={{ padding: 8 }}>
        <div>You staked:</div>
        <Balance address={undefined} balance={balanceStaked} price={ethPrice} />
      </div> */}

      <div style={{ padding: 8 }}>
        <Button
          type={'default'}
          onClick={() => {
            if (tx) {
              tx(stakeContractWrite.execute());
            }
          }}>
          📡 Execute!
        </Button>
      </div>

      <div style={{ padding: 8 }}>
        <Button
          type={'default'}
          onClick={() => {
            if (tx && ethersContext.account) {
              tx(stakeContractWrite.withdraw());
            }
          }}>
          🏧 Withdraw
        </Button>
      </div>

      <div style={{ padding: 8 }}>
        Stack Ether: <input type="number" value={stackEther} onChange={(event) => setStackEther(event.target.value)} />{' '}
        <br />
        <Button
          type={balanceStaked ? 'primary' : 'default'}
          disabled={parseFloat(stackEther) <= 0}
          onClick={() => {
            if (tx) {
              tx(stakeContractWrite.stake({ value: ethers.utils.parseEther(stackEther.toString()) }));
            }
          }}>
          🥩 Stake {stackEther} ether!
        </Button>
      </div>

      <div style={{ padding: 8 }}>
        <Button
          type={balanceStaked ? 'primary' : 'default'}
          onClick={() => {
            if (tx) {
              tx(stakeContractWrite.killTime());
            }
          }}>
          Kill Time
        </Button>
      </div>

      <div style={{ width: 600, margin: 'auto', marginTop: 32, paddingBottom: 32 }}>
        <h2>Events:</h2>
        <List
          bordered
          dataSource={stakeEvents}
          renderItem={(item: any) => {
            return (
              <List.Item
                key={item.blockNumber + '_' + item.sender + '_' + item.purpose}
                style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                  <Address address={item.args[0]} ensProvider={mainnetProvider} fontSize={16} />
                  <div>→</div>
                  <div>{formatEther(item.args[1])}</div>
                </div>
              </List.Item>
            );
          }}
        />
      </div>
    </div>
  );
};
