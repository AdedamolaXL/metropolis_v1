import { useState, useEffect } from 'react';
import { monopolyInstance } from '../../models/Monopoly';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

const DiceControl = () => {
  const [diceValues, setDiceValues] = useState<[number, number]>([1, 1]); // Initial dice values

  useEffect(() => {
    // Listen for the server's dice roll result
    const handleDiceRolled = ({ roll, currentIndex }: { roll: number, currentIndex: number }) => {
      // Update dice values directly from server's roll result
      let dieOne = Math.floor(Math.random() * (roll - 1)) + 1; // Random value for the first die
      let dieTwo = roll - dieOne; // The second die is the difference to make the total sum

      if (dieTwo < 1 || dieTwo > 6) {
        dieOne = Math.floor(Math.random() * (roll - 1)) + 1;
        dieTwo = roll - dieOne;
      }
      
      setDiceValues([dieOne, dieTwo]);
      console.log(dieOne, dieTwo)
      console.log(roll, currentIndex)
    };

    // Subscribe to 'diceRolled' event from the server
    monopolyInstance.socket.on('diceRolled', handleDiceRolled);

    // Cleanup listener on component unmount
    return () => {
      monopolyInstance.socket.off('diceRolled', handleDiceRolled);
    };
  }, []);

  const handleRollDice = () => {
    // Emit roll dice request to server, which will respond with diceRolled
    monopolyInstance.rollDice();
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
    <button onClick={handleRollDice}>Roll Dice</button>
   
  </div>
  );
};

export default DiceControl;
