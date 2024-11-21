import React, { useState } from 'react';
import './DieRoll.css';
import dieRollImg from '../die-roll.gif';

function DieRoll() {

    const [guessInputValue, setGuessInputValue] = useState(0);

    const handleChange = (e: any) => {

        console.log(typeof e);
        const inputValue = e.target.value;

        // Allow empty value for UX (e.g., clearing the input)
        if (inputValue === "") {
            setGuessInputValue(0);
            return;
        }

        const numValue = parseInt(inputValue, 10);

        // Validate the value is between 1 and 6
        if (numValue >= 1 && numValue <= 6) {
            setGuessInputValue(numValue);
        }
    };

    return (
        <div>
            <h1>Die Roller</h1>

            <div>

                <img src={dieRollImg} width="40px" />
                <br />
                <br />

                <p>
                    Guess a number a roll the die to win crypto!
                </p>


                <br />

                <label>
                    Your Guess:&nbsp;
                </label>
                <input
                    className="guess-input"
                    type="number"
                    value={guessInputValue}
                    onChange={handleChange}
                    min="1"
                    max="6"
                />

                <br />
                <br />

                <button
                    type="submit"
                    style={{
                        marginTop: "20px",
                        fontSize: "24px",
                        padding: "15px 30px",
                        borderRadius: "10px",
                        background: "linear-gradient(145deg, #ff9800, #ffc107)",
                        color: "#fff",
                        fontWeight: "bold",
                        border: "none",
                        boxShadow: "0 6px #d17b00",
                        cursor: "pointer",
                        transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                    onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
                        const button = e.currentTarget; // Explicitly an HTMLButtonElement
                        button.style.transform = "translateY(4px)";
                        button.style.boxShadow = "0 2px #d17b00";
                    }}
                    onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
                        const button = e.currentTarget; // Explicitly an HTMLButtonElement
                        button.style.transform = "translateY(0)";
                        button.style.boxShadow = "0 6px #d17b00";
                    }}
                >
                    Roll
                </button>

            </div>

        </div>
    );
}

export default DieRoll;
