import React, { useEffect, useState } from 'react';
import './DieRoll.css';
import dieRollImg from '../die-roll.gif';
import './crypto-stuff/utils';
import startRoll from './crypto-stuff/start-roll';
import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { clusterApiUrl, Commitment, Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Idl, Program, setProvider, Wallet } from "@coral-xyz/anchor";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { connected } from 'process';
import { publicDecrypt } from 'crypto';
import LogHistory from '../log-history/LogHistory';
import { initializeGameForUser, initializeMyProgram, loadSbProgram, setupQueue } from './crypto-stuff/utils';

export type LogHistoryData = {
    playerAddress: String,
    wager: number,
    guess: number,
    numberRolled: number,
    wonOrLost: String,
    blocktime: number,
    blockTimeAgo: String
}

function DieRoll() {

    const [guessInputValue, setGuessInputValue] = useState(0);
    const [error, setError] = useState("");
    const [rollResult, setRollResult] = useState("");
    const [rollResultComment, setRollResultComment] = useState("");
    const [connectedAddress, setConnectedAddress] = useState("");
    const [currentNetwork, setCurrentNetwork] = useState("");
    const [idl, setIdl]: [string | null, any] = useState("");

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

    const emptyPublicKey = new PublicKey(new Uint8Array(32).fill(0));
    console.log(emptyPublicKey.toString());

    const wallet = useWallet();
    const [program, setProgram] = useState({});
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [connection, setConnection] = useState(undefined);
    const [playerStateAccount, setPlayerStateAccount] = useState(emptyPublicKey);
    const [escrowAccount, setEscrowAccount] = useState(emptyPublicKey);
    const [escrowBump, setEscrowBump] = useState(0);
    const [gameAccount, setGameAccount] = useState(emptyPublicKey);
    const [gameAccountBump, setGameAccountBump] = useState(0);
    const [initStuffRan, setInitStuffRan] = useState(false);
    const [isProgramInitializedForAcount, setIsProgramInitializedForAcount] = useState(false);
    const [gameAccountExists, setGameAccountExists] = useState(false);
    const [logHistoryData, setLogHistoryData]: any = useState([]);


    useEffect(() => {
        // if (wallet.connected) {
        // initializeProgram();

        runInitStuff();

        // setConnectedAddress(wallet.publicKey?.toString() ?? "")
        console.log('connected here: ', wallet)
        // }



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
            const programId = "9zYgmAvDrAi64rLuThmCTGF5StSwiRooV3e5k4nd7AAP"

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

            console.log(provider)

            const pid = new PublicKey(programId); // Program ID as PublicKey
            const idl = await Program.fetchIdl(pid, provider);

            setIdl(idl);


            if (!idl) {
                throw new Error(`Failed to fetch IDL for program: ${programId}`);
            }

            console.log('Fetched IDL:', idl);



            if (wallet) {

                if (!wallet.publicKey) {
                    console.log('No public key on wallet... :(')
                }

                else {

                    // moved to connect fn
                }
            }


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

            console.log(solana)

            if (solana) {

                console.log(window.solana.rpcEndpoint)

                const response = await solana.connect();
                console.log("Connected with public key:", response.publicKey.toString());
                console.log("real net")
                console.log(window.solana.rpcEndpoint)
                console.log(window.solana)
                console.log(window.solana.connection)
                console.log(response)
                console.log(window)

                setConnectedAddress(response.publicKey.toString())

                try {
                    const connection = new Connection(clusterApiUrl("devnet"), {
                        commitment: "confirmed",

                    });
                    const programId = new PublicKey('9zYgmAvDrAi64rLuThmCTGF5StSwiRooV3e5k4nd7AAP');

                    const playerStatePDA = await derivePlayerStatePDA(response.publicKey, programId);
                    const gameAccountPDA = await deriveGameAccountPDA(programId);

                    // Get the account info
                    const accountInfo = await connection.getAccountInfo(playerStatePDA);
                    const gameAccountInfo = await connection.getAccountInfo(gameAccountPDA);

                    if (accountInfo === null) {
                        console.log("Account doesn't exist...");
                        setIsProgramInitializedForAcount(false)
                    }
                    else {
                        console.log("Account exists!!");
                        console.log(accountInfo)
                        setIsProgramInitializedForAcount(true)
                    }

                    if (gameAccountInfo === null) {
                        console.log("Game Account doesn't exist...");
                        setGameAccountExists(false)
                    }
                    else {
                        console.log("Game Account exists!!");
                        console.log(gameAccountInfo)
                        setGameAccountExists(true)
                    }

                    console.log("huh? " + gameAccountInfo)

                    const wallet = window.solana; // Assuming Phantom wallet

                    const provider = new AnchorProvider(connection, wallet, {
                        preflightCommitment: "processed",
                    });

                    // Create and return the program
                    const program = new Program(idl as unknown as Idl, provider);
                    console.log("prg");
                    console.log(program)
                    setProgram(program)

                    const PLAYER_STATE_SEED = "playerState";

                    console.log(wallet?.publicKey?.toBuffer())
                    console.log("program id calling: {}", program.programId.toString())
                    console.log("huh? " + JSON.stringify(gameAccountInfo))
                    // const [playerStateAccount, playerStateAccountbump] = PublicKey.findProgramAddressSync(
                    //     [Buffer.from(PLAYER_STATE_SEED), wallet?.publicKey?.toBuffer() ?? Buffer.alloc(0)],
                    //     program.programId
                    // );

                    const [playerStateAccount, bump] = await PublicKey.findProgramAddress(
                        [
                            Buffer.from(PLAYER_STATE_SEED), // Match the program seed
                            response.publicKey.toBuffer() // Match the user key
                        ],
                        program.programId // Program ID must match the deployed program
                    );
                    setPlayerStateAccount(playerStateAccount)

                    const ESCROW_SEED = "stateEscrow";
                    const [escrowAccount, escrowBump] = await PublicKey.findProgramAddressSync(
                        [Buffer.from(ESCROW_SEED)],
                        program.programId
                    );

                    setEscrowAccount(escrowAccount)
                    setEscrowBump(escrowBump)

                    const GAME_ACCOUNT_SEED = "gameAccount";
                    const [gameAccount, gameAccountBump] = await PublicKey.findProgramAddressSync(
                        [Buffer.from(GAME_ACCOUNT_SEED)],
                        program.programId
                    );

                    setGameAccount(gameAccount)
                    setGameAccountBump(gameAccountBump)

                    console.log("gameAccountInfo base:", gameAccount.toBase58());
                    console.log("gameAccountInfo string:", gameAccount.toString());

                } catch (error) {
                    console.error("Error checking account:", error);
                    return false;
                }



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

            {connectedAddress && <div>
                <i>

                    {"Connected wallet: "}
                    <a href={"https://solscan.io/account/" + connectedAddress}>{connectedAddress.slice(0, 5) + '...' + connectedAddress.slice(connectedAddress.length - 6, connectedAddress.length - 1)}</a>
                </i>
            </div>
            }
            {
                connectedAddress && <div>
                    <br />

                    <i>
                        Note: devnet is currently the only supported network!
                        <br />
                        Please switch your wallet to devnet.
                    </i>
                    <br />
                    <br />
                    <br />
                </div>
            }

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
                    value={guessInputValue}
                    onChange={handleChange}
                    inputMode="numeric"
                    type="number" min="0" max="6" step="1" placeholder="-"
                />

                <br />
                {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
                <br />

                <br />
                {rollResult != "" && <p style={{ color: "white", marginTop: "10px" }}>{rollResult}</p>}
                <br />
                {rollResultComment != "" && <p style={{ color: "white", marginTop: "10px" }}>{rollResultComment}</p>}
                <br />
                <br />

                {connectedAddress && isProgramInitializedForAcount && <button
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
                            setRollResultComment("");
                            console.log("Roll button clicked! Guessing: ", guessInputValue);

                            // await initializeProgram();

                            const result = await startRoll(+guessInputValue, setRollResult, setRollResultComment, playerStateAccount, gameAccount, escrowAccount, escrowBump);

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
                </button>}

                {connectedAddress && <button
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

                        const innterConnection = new Connection(clusterApiUrl("devnet"), "confirmed");

                        // Create the wallet provider (you might use Phantom or Sollet wallet in production)
                        const wallet = (window as any).solana; // Assuming Phantom wallet
                        // setWallet(wallet);

                        if (wallet) {
                            // Set up the Anchor provider
                            // const provider = new AnchorProvider(connection, wallet, {
                            //     preflightCommitment: "processed",
                            // });

                            const wallet = window.solana; // Assuming Phantom wallet

                            const provider = new AnchorProvider(innterConnection, wallet, {
                                preflightCommitment: "processed",
                            });

                            console.log('pp1 ', program)
                            console.log('provider ', provider)
                            console.log('wallet ', wallet)
                            let queue = await setupQueue(program as Program);
                            // console.log("queue: ", queue);
                            // const myProgram = await initializeMyProgram(program!.provider);
                            console.log("my program: ", program);
                            console.log("playerStateAccount: ", playerStateAccount.toString());
                            console.log("escrowAccount: ", escrowAccount.toString());
                            // const sbProgram = await loadSbProgram((program as Program).provider);
                            // console.log("sbProgram: ", sbProgram);

                            const PLAYER_STATE_SEED = "playerState";
                            // const ESCROW_SEED = "stateEscrow";

                            const [playerStateAccount3, playerStateAccountbump] = await PublicKey.findProgramAddressSync(
                                [Buffer.from(PLAYER_STATE_SEED), wallet.publicKey.toBuffer()],
                                (program as Program).programId
                            );

                            // const [escrowAccount, escrowBump] = await PublicKey.findProgramAddressSync(
                            //     [Buffer.from(ESCROW_SEED)],
                            //     (program as Program).programId
                            // );

                            // console.log('initializing game')

                            await initializeGameForUser((program as Program), playerStateAccount3, escrowAccount, innterConnection, wallet, setIsProgramInitializedForAcount);

                            console.log('initialized!')
                        }
                        // callInitialize(program, (wallet as any))


                        // if (guessInputValue === 0) {
                        //     setError("Please enter a number between 1 and 6.");
                        // } else {
                        //     setError("");
                        //     setRollResultComment("");
                        //     console.log("Roll button clicked! Guessing: ", guessInputValue);

                        //     // await initializeProgram();

                        //     const result = await startRoll(+guessInputValue, setRollResult, setRollResultComment);

                        //     // setRollResult(result)
                        // }

                    }
                    }
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
                    Initialize Game
                </button>}

                {connectedAddress && <button
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

                        const innterConnection = new Connection(clusterApiUrl("devnet"), "confirmed");

                        // Create the wallet provider (you might use Phantom or Sollet wallet in production)
                        const wallet = (window as any).solana; // Assuming Phantom wallet
                        // setWallet(wallet);

                        if (wallet) {
                            // Set up the Anchor provider
                            // const provider = new AnchorProvider(connection, wallet, {
                            //     preflightCommitment: "processed",
                            // });

                            const wallet = window.solana; // Assuming Phantom wallet

                            const provider = new AnchorProvider(innterConnection, wallet, {
                                preflightCommitment: "processed",
                            });

                            console.log('pp1 ', program)
                            console.log('provider ', provider)
                            console.log('wallet ', wallet)
                            let queue = await setupQueue(program as Program);
                            // console.log("queue: ", queue);
                            // const myProgram = await initializeMyProgram(program!.provider);
                            console.log("my program: ", program);
                            const sbProgram = await loadSbProgram((program as Program).provider);
                            // console.log("sbProgram: ", sbProgram);

                            const PLAYER_STATE_SEED = "playerState";
                            const ESCROW_SEED = "stateEscrow";

                            const [playerStateAccount, playerStateAccountbump] = await PublicKey.findProgramAddressSync(
                                [Buffer.from(PLAYER_STATE_SEED), wallet.publicKey.toBuffer()],
                                (program as Program).programId
                            );
                            console.log("playerStateAccount: ", playerStateAccount.toString());

                            const [escrowAccount, escrowBump] = await PublicKey.findProgramAddressSync(
                                [Buffer.from(ESCROW_SEED)],
                                (program as Program).programId
                            );
                            console.log("escrowAccount: ", escrowAccount.toString());

                            // console.log('initializing game')

                            await initializeGameForUser(
                                (program as Program),
                                playerStateAccount,
                                escrowAccount,
                                innterConnection,
                                wallet,
                                setIsProgramInitializedForAcount
                            );

                            // await initializeGame((program as Program), playerStateAccount, escrowAccount, innterConnection, wallet, setIsProgramInitializedForAcount);

                            console.log('initialized!')
                        }
                        // callInitialize(program, (wallet as any))


                        // if (guessInputValue === 0) {
                        //     setError("Please enter a number between 1 and 6.");
                        // } else {
                        //     setError("");
                        //     setRollResultComment("");
                        //     console.log("Roll button clicked! Guessing: ", guessInputValue);

                        //     // await initializeProgram();

                        //     const result = await startRoll(+guessInputValue, setRollResult, setRollResultComment);

                        //     // setRollResult(result)
                        // }

                    }
                    }
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
                    Init
                </button>}

                <button onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    console.log("WTF??");
                }}>WHAT</button>

                {!connectedAddress && <button
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
                    onClick={(_e: any) => {

                        connectWallet()

                        console.log("foo")


                        _e.stopPropagation();

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
                    Connect wallet
                </button>}

            </div>


            {/* Recent Rolls */}
            <br />
            <br />
            <br />
            <br />

            <LogHistory data={logHistoryData} />

            <br />
            <br />
            <br />
            {/* <pre>

                {JSON.stringify(logHistoryData, null, 2)}
            </pre>  */}

            {/* <div className="LogHistory">
                <div className="table-container">
                    <h2 className="table-title">Recent Rolls</h2>
                    <table className="recent-rolls-table">
                        <tbody>
                            {logHistoryData.map((item: LogHistoryData, index: number) => (
                                <tr key={index} className="table-row">
                                    <td className="left-column">foo, {item.wonOrLost}</td>
                                    <td className="right-column">{item.blockTimeAgo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div> */}

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

const deriveGameAccountPDA = async (programId: PublicKey) => {
    const [gameState] = await PublicKey.findProgramAddress(
        [
            Buffer.from('gameAccount')
        ],
        programId
    );
    return gameState;
};

