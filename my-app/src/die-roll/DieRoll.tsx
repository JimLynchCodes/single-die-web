import React, { useEffect, useState } from 'react';
import './DieRoll.css';
import dieRollImg from '../die-roll.gif';
import './crypto-stuff/utils';
import startRoll from './crypto-stuff/start-roll';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Commitment, ConfirmOptions, Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program, setProvider, Wallet } from "@coral-xyz/anchor";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { connected } from 'process';
import { publicDecrypt } from 'crypto';
import LogHistory from '../log-history/LogHistory';

export type LogHistoryData = {
    playerAddress: String,
    wager: number,
    guess: number,
    numberRolled: number,
    wonOrLost: String,
    blocktime: number,
    blockTimeAgo: String
}

const PLAYER_STATE_SEED = "playerState";
const GAME_STATE_SEED = "gameState";

const COMMITMENT = "confirmed";

function DieRoll() {

    const [guessInputValue, setGuessInputValue] = useState(0);
    const [error, setError] = useState("");
    const [rollResult, setRollResult] = useState("");
    const [rollResultComment, setRollResultComment] = useState("");
    const [connectedAddress, setConnectedAddress] = useState("");
    const [accountExistence, setAccountExistence] = useState(false);
    const [currentNetwork, setCurrentNetwork] = useState("");

    const wallet = useWallet();
    const [program, setProgram] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [connection, setConnection] = useState(undefined);
    const [initStuffRan, setInitStuffRan] = useState(false);
    const [logHistoryData, setLogHistoryData]: any = useState([]);

    const [anchorProvider, setAnchorProvider] = useState<AnchorProvider | null>(null);

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

        const lastDigit = numValue.toString().slice(numValue.toString().length - 1, numValue.toString().length);

        setGuessInputValue(+lastDigit);
        setError("");
        // }
    };



    useEffect(() => {

        runInitStuff();

        console.log('connected here: ', wallet)


    }, [initStuffRan]);

    const runInitStuff = async () => {

        const initialize = async () => {

            if (initStuffRan === false) {
                setInitStuffRan(true);
                await initializeProgram();
            }
        };

        initialize();
    }

    const initializeProgram = async () => {
        try {

            console.log('initializing program');

            // Constants
            // const programId = "3gHtqUaKGu3RJCWVbgQFd5Gv4MQfQKmQjKSvdejkLoA7"
            const programId = "4WQeVUwiBic2FLsGEvtRLLN7muFpwDVr62h5yWiPU8Hk"

            const network = 'https://api.devnet.solana.com';  // Devnet endpoint
            const opts = {
                preflightCommitment: 'confirmed',
                commitment: 'confirmed',
            };
            // Create a connection to the devnet
            // const connection = new Connection(network, (opts.commitment as Commitment));
            const connection = new Connection(clusterApiUrl("devnet"), {
                commitment: "confirmed",

            });







            // setConnection(connection)

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

            // const version = await response.getVersion();
            console.log('Connected to:', connection.rpcEndpoint);

            if (network.includes('devnet')) {
                setCurrentNetwork('devnet')
                console.log('devnet');
            } else if (network.includes('testnet')) {
                setCurrentNetwork('testnet')
                console.log('testnet');
            } else {
                setCurrentNetwork('mainnet')
                console.log('mainnet');
            }

            const provider = new AnchorProvider(connection, (wallet as any), { preflightCommitment: 'processed' });

            setAnchorProvider(provider)

            console.log(provider)

            const pid = new PublicKey(programId); // Program ID as PublicKey
            const idl = await Program.fetchIdl(pid, provider);

            if (!idl) {
                throw new Error(`Failed to fetch IDL for program: ${programId}`);
            }

            console.log('Fetched IDL:', JSON.stringify(idl, null, 2));

            // Create and return the program
            const program = new Program(idl, provider);
            console.log("p");
            console.log(program)
            // setProgram(program)

            // const gameState = await program.account.gameState.fetch(gameStatePublicKey);

            // console.log("Game state:", gameState);


            const getHistoryLogs = async (connection: Connection, programId: PublicKey): Promise<any> => {

                console.log("fetching logs...", programId.toString())

                // Get logs not more than 2 days old
                const now = Date.now();
                const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

                // Fetch all signatures for the program in the last 24 hours
                const signatures = await connection.getSignaturesForAddress(programId, {
                    limit: 10, // Adjust as needed
                    // until: new Date(twoDaysAgo).toISOString(),
                });

                console.log(`Found ${signatures.length} transactions in the past 24 hours.`);

                console.table(signatures)

                const logs: any[] = [];

                // const alreadyChecked: any = {};

                const alreadyChecked: Map<String, Boolean> = new Map();

                for (const [index, sigInfo] of signatures.entries()) {

                    console.log('signature is: ', sigInfo)

                    setTimeout(async () => {

                        // console.log("before: " + alreadyChecked.get(sigInfo.signature))

                        if (alreadyChecked.get(sigInfo.signature) === undefined) {
                            alreadyChecked.set(sigInfo.signature, true)

                            // console.log("set sig: " + sigInfo.signature)
                            // console.log("after " + alreadyChecked.get(sigInfo.signature))

                            const tx = await connection.getTransaction(sigInfo.signature, {
                                commitment: "confirmed",
                                "maxSupportedTransactionVersion": 0
                            });

                            // console.log('tx: ', tx)

                            if (tx && tx.meta && tx.meta.logMessages) {
                                const flipLogs = tx.meta.logMessages.filter((log) =>
                                    log.includes("ROLL_RESULT")
                                );

                                if (flipLogs.length > 0) {

                                    // Extract the relevant parts using a regular expression
                                    const match = flipLogs[0].match(
                                        /ROLL_RESULT: (\d+) for player: ([\w.]+) who guessed: (\d+) with wager: (\d+)/
                                    );

                                    if (!match) {
                                        throw new Error(`Log format invalid: ${flipLogs[0]}`);
                                    }

                                    // Destructure the matched groups
                                    const [, numberRolled, playerAddress, guess, wager] = match;

                                    // Determine if the player won or lost
                                    const wonOrLost = numberRolled === guess ? "won" : "lost";

                                    // Return the parsed data as an object


                                    const logData = {
                                        playerAddress,
                                        wager: parseInt(wager, 10),
                                        guess: parseInt(guess, 10),
                                        numberRolled: parseInt(numberRolled, 10),
                                        wonOrLost,
                                        blocktime: tx.blockTime,
                                        blockTimeAgo: calculateTimeAgo(tx.blockTime)
                                    };

                                    // logs.push(logData);

                                    console.log("old data: ", logHistoryData)
                                    // setLogHistoryData([...logHistoryData, logData])

                                    setLogHistoryData((prevLogHistoryData: any) => [...prevLogHistoryData, logData]);

                                    console.log("new data: ", logData)
                                }
                            }
                        }
                    }, 600 * index)

                }


                return 4;
            }

            getHistoryLogs(connection, pid);

        } catch (error) {
            console.error('Error initializing program:', error);
            setError('Failed to initialize program');
        }
    };

    function calculateTimeAgo(blockTime?: number | null): string {

        if (!blockTime)
            return ""

        // Get the current time in milliseconds
        const now = Date.now();

        // Ensure blockTime is in milliseconds (convert from seconds if needed)
        if (blockTime < 1e12) {
            blockTime *= 1000; // Convert seconds to milliseconds
        }

        // Calculate the difference in milliseconds
        const timeDifference = now - blockTime;

        // Convert to minutes and hours
        const minutesAgo = Math.floor(timeDifference / (1000 * 60));
        const hoursAgo = Math.floor(timeDifference / (1000 * 60 * 60));

        // Return a human-readable string
        if (minutesAgo < 60) {

            if (minutesAgo === 0)
                return "just now"

            return `${minutesAgo} minute${minutesAgo === 1 ? "" : "s"} ago`;
        } else {
            return `${hoursAgo} hour${hoursAgo === 1 ? "" : "s"} ago`;
        }
    }

    const connectWallet = async () => {
        try {
            const { solana } = window;

            if (solana) {


                console.log("real net")
                console.log(window.solana.rpcEndpoint)


                const response = await solana.connect();
                console.log("Connected with public key:", response.publicKey.toString());
                console.log("real net")
                console.log(window.solana.rpcEndpoint)
                console.log(window.solana)
                console.log(window.solana.connection)
                console.log(response)
                console.log(window)

                try {
                    const connection = new Connection(clusterApiUrl("devnet"), {
                        commitment: "confirmed",

                    });
                    // const programId = new PublicKey('3gHtqUaKGu3RJCWVbgQFd5Gv4MQfQKmQjKSvdejkLoA7');
                    const programId = new PublicKey('4WQeVUwiBic2FLsGEvtRLLN7muFpwDVr62h5yWiPU8Hk');

                    const playerStatePDA = await derivePlayerStatePDA(response.publicKey, programId);

                    // Get the account info
                    const accountInfo = await connection.getAccountInfo(playerStatePDA);

                    if (accountInfo === null) {
                        console.log("Account doesn't exist...");

                        setAccountExistence(false);

                    }
                    else {
                        console.log("Account exists!!");
                        console.log(accountInfo)
                        setAccountExistence(true);
                    }

                } catch (error) {
                    console.error("Error checking account:", error);
                    return false;
                }

                setConnectedAddress(response.publicKey.toString())

            } else {
                console.error("Phantom Wallet not available");
            }
        } catch (error) {
            console.error("Error connecting to wallet:", error);
        }
    };


    return (
        <div>

            Uh oh! Down for maintenance...

        </div>
    );
}

export default DieRoll;

const derivePlayerStatePDA = async (userPublicKey: PublicKey, programId: PublicKey) => {
    const [playerState] = await PublicKey.findProgramAddress(
        [
            Buffer.from('playerState'),
            userPublicKey.toBuffer()
        ],
        programId
    );
    return playerState;
};

