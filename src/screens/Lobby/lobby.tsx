/** 
  * Explanation:
  * Real-time Game Updates:
  * We use onSnapshot from Firestore to listen for real-time updates in the games collection. When a new game is created or a game is updated (e.g., when a player joins), the games state is updated automatically.
  * Creating a New Game:
  * When a user creates a game, their name is added to the players array, and they are set as the creator (creator: user.uid). The new game is saved in Firestore.
  * Joining an Existing Game:
  * Players can join a game by clicking the "Join" button. The player's name is added to the players array in Firestore using the arrayUnion function, ensuring they are added without overwriting existing players.
  *
 * 
*/
// pages/lobby.tsx
import React, { useEffect } from 'react';
import useLobbyStore from '../../store/lobbyStore';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, getDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore'; // Import the correct Firestore functions
import useAuthStore from '../../store/authStore';
import Auth from '../../components/Auth';

// Define the GameState interface at the top or in a separate file
interface GameState {
  id: string;
  name: string;
  players: string[];  // Array of player names
  creator: string;    // UID of the game creator
  // Add any other fields your game needs
}

const Lobby: React.FC = () => {
  const { games, setGames, playerName, setPlayerName, setCurrentGame } = useLobbyStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const gamesCollection = collection(db, 'games'); // Get reference to the 'games' collection

    const unsubscribe = onSnapshot(gamesCollection, (snapshot) => {
      const gamesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as GameState));

      setGames(gamesData);
    });

    return () => unsubscribe();
  }, [setGames]);

  const handleCreateGame = async () => {
    if (!user) {
      alert('You need to sign in to create a game!');
      return;
    }

    if (playerName === '') {
      alert('Please enter your name!');
      return;
    }

    try {
      const gamesCollection = collection(db, 'games'); // Get reference to 'games' collection
      const newGameRef = await addDoc(gamesCollection, {
        name: `${playerName}'s Game`,
        players: [playerName],
        creator: user.uid,
        // ... other initial game state
      });

      const newGameSnapshot = await getDoc(newGameRef);
      const newGameData = newGameSnapshot.data() as GameState;

      const gameDataWithId = { ...newGameData, id: newGameRef.id };
      setCurrentGame(gameDataWithId);

      // (Optional) Redirect to game room
      // router.push(`/game/${newGameRef.id}`);
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const handleJoinGame = async (gameId: string) => {
    if (!user) {
      alert('You need to sign in to join a game!');
      return;
    }

    if (playerName === '') {
      alert('Please enter your name!');
      return;
    }

    try {
      const gameRef = doc(db, 'games', gameId); // Reference to the specific game
      await updateDoc(gameRef, {
        players: arrayUnion(playerName), // Add player to the players array
      });

      const updatedGameSnapshot = await getDoc(gameRef);
      const updatedGameData = updatedGameSnapshot.data() as GameState;
      const { id, ...restGameData } = updatedGameData;
      setCurrentGame({ id: gameId, ...restGameData });


      // (Optional) Redirect to game room
      // router.push(`/game/${gameId}`);
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  return (
    <div>
      <h1>Monopoly Lobby</h1>
      <Auth /> {/* Add the authentication component */}

      {user && (
        <>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
          />

          <h2>Available Games</h2>
          <ul>
            {games.map((game) => (
              <li key={game.id}>
                {game.name} - {game.players.length} players
                <button onClick={() => handleJoinGame(game.id)}>Join</button>
              </li>
            ))}
          </ul>

          <button onClick={handleCreateGame}>Create Game</button>
        </>
      )}
    </div>
  );
};

export default Lobby;
