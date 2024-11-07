import { expect } from "chai";
import { deployments, getUnnamedAccounts } from "hardhat";
import { ethers } from "hardhat";
import { MonopolyGameFactory } from "../typechain-types/index.js";
import { setupUsers } from "./index";

const setup = deployments.createFixture(async () => {
  await deployments.fixture('MonopolyGameFactory');

  const contracts = {
    MonopolyGameFactory: <MonopolyGameFactory>await ethers.getContract('MonopolyGameFactory'),
  };
  const users = await setupUsers(await getUnnamedAccounts(), contracts);
  return {
    ...contracts,
    users,
  };
});

describe('MonopolyGameFactory', function () {
  before(async function () {
    const { users, MonopolyGameFactory } = await setup();
    // You can set up any initial configurations here if needed
  });

  it('should create a new Monopoly game', async function () {
    const { users, MonopolyGameFactory } = await setup();
    const tx = await MonopolyGameFactory.createGame(users[0].address, users[1].address);
    await tx.wait();

    const gameCount = await MonopolyGameFactory.getGameCount();
    expect(gameCount).to.equal(1);

    const gameAddress = await MonopolyGameFactory.getGameAtIndex(0);
    expect(gameAddress).to.properAddress;

    const MonopolyGame = await ethers.getContractFactory("MonopolyGame");
    const game = MonopolyGame.attach(gameAddress) as MonopolyGame;

    const player1 = await game.players(0);
    const player2 = await game.players(1);

    expect(player1.addr).to.equal(users[0].address);
    expect(player2.addr).to.equal(users[1].address);
    expect(player1.balance).to.equal(1500);
    expect(player2.balance).to.equal(1500);
  });

  it('should get the correct game count', async function () {
    const { users, MonopolyGameFactory } = await setup();
    await MonopolyGameFactory.createGame(users[0].address, users[1].address);
    await MonopolyGameFactory.createGame(users[2].address, users[3].address);

    const gameCount = await MonopolyGameFactory.getGameCount();
    expect(gameCount).to.equal(2);
  });
});