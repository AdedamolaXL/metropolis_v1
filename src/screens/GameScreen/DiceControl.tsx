import { useState, useEffect } from 'react';
import { monopolyInstance } from '../../models/Monopoly';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';



const DiceControl = () => {
  const [diceValues, setDiceValues] = useState<[number, number]>([1, 1]);
  const [isTurn, setIsTurn] = useState<boolean>(false);

  useEffect(() => {
    const handleDiceRolled = ({ roll, currentIndex }: { roll: number, currentIndex: number }) => {
      let dieOne = Math.floor(Math.random() * (roll - 1)) + 1;
      let dieTwo = roll - dieOne;

      if (dieTwo < 1 || dieTwo > 6) {
        dieOne = Math.floor(Math.random() * (roll - 1)) + 1;
        dieTwo = roll - dieOne;
      }
      
      setDiceValues([dieOne, dieTwo]);
      console.log(dieOne, dieTwo);
      console.log(roll, currentIndex);
    };

    // Subscribe to 'diceRolled' event from the server
    monopolyInstance.socket.on('diceRolled', handleDiceRolled);

    const handleTurnChanged = (nextPlayerId: string) => {
      const currentPlayerId = monopolyInstance.currentPlayer?.id;
      console.log("Turn changed:", { nextPlayerId, currentPlayerId });

      const isCurrentTurn = currentPlayerId === nextPlayerId;
      setIsTurn(isCurrentTurn);

      console.log("Is it current player’s turn?", isCurrentTurn);
    };
    
    monopolyInstance.socket.on('diceRolled', handleDiceRolled);
    monopolyInstance.socket.on('turnChanged', handleTurnChanged);

    return () => {
      monopolyInstance.socket.off('diceRolled', handleDiceRolled);
      monopolyInstance.socket.off('turnChanged', handleTurnChanged);
    };
  }, []);

  const handleRollDice = () => {
    if (!isTurn) {
      console.log("It's not your turn!");
    }
    console.log("Rolling the dice...");
    monopolyInstance.rollDice(); // Proceed to roll dice
  };



  const getDiceIcon = (value: number, size: number = 24) => {
    switch (value) {
      case 1: return <Dice1 size={size} />;
      case 2: return <Dice2 size={size} />;
      case 3: return <Dice3 size={size} />;
      case 4: return <Dice4 size={size} />;
      case 5: return <Dice5 size={size} />;
      case 6: return <Dice6 size={size} />;
      default: return null;
    }
  };

  const total = diceValues[0] + diceValues[1];


  return (
    <div className="dice-control">
      <div className="dice">
        <div className="die">
          {getDiceIcon(diceValues[0], 48)} {/* Render the first die */}
        </div>
        <div className="die">
          {getDiceIcon(diceValues[1], 48)} {/* Render the second die */}
        </div>
      </div>
      <div className="dice-total">
        <span>Total: {total}</span> {/* Render the total */}
      </div>
      <button onClick={handleRollDice} >Roll Dice</button>
      {/* <div>
        <p>Current Turn Status: {isTurn ? "Your Turn" : "Not Your Turn"}</p>
      </div> */}
    </div>
  );
};

export default DiceControl;
