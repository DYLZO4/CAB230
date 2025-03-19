import { useState } from "react";

export default function LikeCounter() {
    const [count, setCount] = useState(0);
    const [superLikes, setSuperLikes] = useState(0);
    const increment = () => setCount(count => count + 1);
    const decrement = () => setCount(count => count - 1);
    const superIncrement = () => {
      setSuperLikes(count => count < 2 ? count + 1 : count);
    };
  
    return (
      <div>
        <p>Like Count: {count + superLikes * 10}</p>
        <button onClick={increment}>Like</button>
        <button onClick={superIncrement}>Super Like</button>
        <button onClick={decrement}>Dislike</button>
      </div>
    );
  }