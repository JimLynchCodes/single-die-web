import React, { useEffect, useState } from 'react';
import './DieRoll.css';
import dieRollImg from '../die-roll.gif';
import './crypto-stuff/utils';
import startRoll from './crypto-stuff/start-roll';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { Commitment, Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, setProvider, Wallet } from "@coral-xyz/anchor";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

function DieRoll() {

    const [guessInputValue, setGuessInputValue] = useState(0);
    const [error, setError] = useState("");
    const [rollResult, setRollResult] = useState(-1);

    const anchorWallet = useAnchorWallet();

    const handleChange = (e: any) => {

        console.log(typeof e);
        const inputValue = e.target.value;

        // Allow empty value for UX (e.g., clearing the input)
        if (inputValue === "") {
            setGuessInputValue(0);
            setError("");
            return;
        }

        const numValue = parseInt(inputValue, 10);

        // Validate the value is between 1 and 6
        if (numValue >= 1 && numValue <= 6) {
            setGuessInputValue(numValue);
            setError("");
        }
    };



    const wallet = useWallet();
    const [program, setProgram] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);



    // const network = 'https://api.devnet.solana.com';
    // // const programID = new PublicKey(idl.address);
    // const programID = new PublicKey(myProgramDevAddress);
    // const opts = {
    //   preflightCommitment: 'confirmed',
    //   commitment: 'confirmed',
    // };
    // const connection = new Connection(network, (opts.commitment as Commitment));
    useEffect(() => {
        if (wallet.connected) {
            initializeProgram();
        }
    }, [wallet.connected]);

    const initializeProgram = async () => {
        try {

            // Constants
            const programId = "3gHtqUaKGu3RJCWVbgQFd5Gv4MQfQKmQjKSvdejkLoA7"

            const network = 'https://api.devnet.solana.com';  // Devnet endpoint
            const opts = {
                preflightCommitment: 'confirmed',
                commitment: 'confirmed',
            };
            // Create a connection to the devnet
            const connection = new Connection(network, (opts.commitment as Commitment));
            // Define the program ID from the IDL (replace with your actual program ID)
            // const programID = new PublicKey("6Txeg9dhUq3aNhgoATKW1eeoxgdjvyxHxn2xhtELi7Ba");
            // Set up the provider
            // const provider = new AnchorProvider(
            //     connection,
            //     wallet as Wallet,  // Use local wallet for provider (use your wallet here if needed)
            //     opts
            // );
            // setProvider(provider);
            // const idl = require("./sb_randomness.json");
            // Generate the program client from IDL.
            // const program = new Program(idl);
            // console.log("program", program)
            // Execute the RPC.
            // await program.rpc.initialize();
            // setProgram(program);


            const provider = new AnchorProvider(connection, (wallet as any), { preflightCommitment: 'processed' });

            const pid = new PublicKey(programId); // Program ID as PublicKey
            const idl = await Program.fetchIdl(pid, provider);

            if (!idl) {
                throw new Error(`Failed to fetch IDL for program: ${programId}`);
            }

            console.log('Fetched IDL:', idl);

            // Create and return the program
            const program = new Program(idl, provider);
            console.log("p");
            console.log(program)

        } catch (error) {
            console.error('Error initializing program:', error);
            setError('Failed to initialize program');
        }
    };

    const connectWallet = async () => {
        try {
            const { solana } = window;

            if (solana && solana.isPhantom) {
                const response = await solana.connect();
                console.log("Connected with public key:", response.publicKey.toString());
            } else {
                console.error("Phantom Wallet not available");
            }
        } catch (error) {
            console.error("Error connecting to wallet:", error);
        }
    };


    return (
        <div>

            <br />

            {/* <WalletMultiButton /> */}

            <h1>Die Roller</h1>

            <div>

                <img src={dieRollImg} width="40px" />
                <br />
                <br />

                <p>
                    Guess a number and roll the die to win crypto!
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
                {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
                <br />
                
                <br />
                {rollResult != -1 && <p style={{ color: "white", marginTop: "10px" }}>{"You rolled: " + rollResult}</p>}
                <br />

                <button
                    type="submit"
                    style={{
                        margin: "20px",
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
                    onClick={async (_e: any) => {

                        if (guessInputValue === 0) {
                            setError("Please enter a number between 1 and 6.");
                        } else {
                            setError("");
                            console.log("Roll button clicked! Guessing: ", guessInputValue);

                            const result = await startRoll(+guessInputValue, setRollResult);

                            // setRollResult(result)
                        }

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
                {/* <button
                    type="submit"
                    style={{
                        margin: "20px",
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
                    onClick={async (_e: any) => {

                       connectWallet()

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
                    Conenct wallet
                </button> */}

            </div>

        </div>
    );
}

export default DieRoll;
