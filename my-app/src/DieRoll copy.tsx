// import React, { useEffect, useState } from 'react';
// import './DieRoll.css';
// import dieRollImg from '../die-roll.gif';
// import './die-roll/crypto-stuff/utils';
// import startRoll from './die-roll/crypto-stuff/start-roll';
// import { useAnchorWallet, useWallet } from '@solana/wallet-adapter-react';
// import { clusterApiUrl, Commitment, ConfirmOptions, Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
// import { AnchorProvider, Program, setProvider, Wallet } from "@coral-xyz/anchor";
// import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
// import { connected } from 'process';
// import { publicDecrypt } from 'crypto';
// import LogHistory from './log-history/LogHistory';

// export type LogHistoryData = {
//     playerAddress: String,
//     wager: number,
//     guess: number,
//     numberRolled: number,
//     wonOrLost: String,
//     blocktime: number,
//     blockTimeAgo: String
// }

// const PLAYER_STATE_SEED = "playerState";
// const GAME_STATE_SEED = "gameState";

// const COMMITMENT = "confirmed";

// function DieRoll() {

//     const [guessInputValue, setGuessInputValue] = useState(0);
//     const [error, setError] = useState("");
//     const [rollResult, setRollResult] = useState("");
//     const [rollResultComment, setRollResultComment] = useState("");
//     const [connectedAddress, setConnectedAddress] = useState("");
//     const [accountExistence, setAccountExistence] = useState(false);
//     const [currentNetwork, setCurrentNetwork] = useState("");
//     // const [playerStateAccount, setPlayerStateAccount] = useState("");

//     const wallet = useWallet();
//     const [program, setProgram] = useState(null);
//     const [data, setData] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [connection, setConnection] = useState(undefined);
//     const [initStuffRan, setInitStuffRan] = useState(false);
//     const [logHistoryData, setLogHistoryData]: any = useState([]);

//     const [anchorProvider, setAnchorProvider] = useState<AnchorProvider | null>(null);

//     const anchorWallet = useAnchorWallet();

//     const handleChange = (e: any) => {

//         console.log(typeof e);
//         const inputValue = e.target.value;

//         // Allow empty value for UX (e.g., clearing the input)
//         if (inputValue === "") {
//             setGuessInputValue(0);
//             setError("");
//             return;
//         }

//         const numValue = parseInt(inputValue, 10);

//         const lastDigit = numValue.toString().slice(numValue.toString().length - 1, numValue.toString().length);

//         setGuessInputValue(+lastDigit);
//         setError("");
//         // }
//     };



//     useEffect(() => {

//         runInitStuff();

//         console.log('connected here: ', wallet)


//     }, [initStuffRan]);

//     const runInitStuff = async () => {

//         const initialize = async () => {

//             if (initStuffRan === false) {
//                 setInitStuffRan(true);
//                 await initializeProgram();
//             }
//         };

//         initialize();
//     }

//     const initializeProgram = async () => {
//         try {

//             console.log('initializing program');

//             // Constants
//             // const programId = "9zYgmAvDrAi64rLuThmCTGF5StSwiRooV3e5k4nd7AAP"
//             const programId = "9zYgmAvDrAi64rLuThmCTGF5StSwiRooV3e5k4nd7AAP"

//             const network = 'https://api.devnet.solana.com';  // Devnet endpoint
//             const opts = {
//                 preflightCommitment: 'confirmed',
//                 commitment: 'confirmed',
//             };
//             // Create a connection to the devnet
//             // const connection = new Connection(network, (opts.commitment as Commitment));
//             const connection = new Connection(clusterApiUrl("devnet"), {
//                 commitment: "confirmed",

//             });

//             // const version = await response.getVersion();
//             console.log('Connected to:', connection.rpcEndpoint);

//             if (network.includes('devnet')) {
//                 setCurrentNetwork('devnet')
//                 console.log('devnet');
//             } else if (network.includes('testnet')) {
//                 setCurrentNetwork('testnet')
//                 console.log('testnet');
//             } else {
//                 setCurrentNetwork('mainnet')
//                 console.log('mainnet');
//             }

//             const provider = new AnchorProvider(connection, (wallet as any), { preflightCommitment: 'processed' });

//             setAnchorProvider(provider)

//             console.log(provider)

//             const pid = new PublicKey(programId); // Program ID as PublicKey
//             const idl = await Program.fetchIdl(pid, provider);

//             if (!idl) {
//                 throw new Error(`Failed to fetch IDL for program: ${programId}`);
//             }

//             console.log('Fetched IDL:', JSON.stringify(idl, null, 2));

//             // Create and return the program
//             const program = new Program(idl, provider);
//             console.log("p");
//             console.log(program)
//             // setProgram(program)

//             // const gameState = await program.account.gameState.fetch(gameStatePublicKey);

//             // console.log("Game state:", gameState);


//             const getHistoryLogs = async (connection: Connection, programId: PublicKey): Promise<any> => {

//                 console.log("fetching logs...", programId.toString())

//                 // Get logs not more than 2 days old
//                 const now = Date.now();
//                 const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;

//                 // Fetch all signatures for the program in the last 24 hours
//                 const signatures = await connection.getSignaturesForAddress(programId, {
//                     limit: 10, // Adjust as needed
//                     // until: new Date(twoDaysAgo).toISOString(),
//                 });

//                 console.log(`Found ${signatures.length} transactions in the past 24 hours.`);

//                 console.table(signatures)

//                 const logs: any[] = [];

//                 // const alreadyChecked: any = {};

//                 const alreadyChecked: Map<String, Boolean> = new Map();

//                 for (const [index, sigInfo] of signatures.entries()) {

//                     console.log('signature is: ', sigInfo)

//                     setTimeout(async () => {

//                         // console.log("before: " + alreadyChecked.get(sigInfo.signature))

//                         if (alreadyChecked.get(sigInfo.signature) === undefined) {
//                             alreadyChecked.set(sigInfo.signature, true)

//                             // console.log("set sig: " + sigInfo.signature)
//                             // console.log("after " + alreadyChecked.get(sigInfo.signature))

//                             const tx = await connection.getTransaction(sigInfo.signature, {
//                                 commitment: "confirmed",
//                                 "maxSupportedTransactionVersion": 0
//                             });

//                             // console.log('tx: ', tx)

//                             if (tx && tx.meta && tx.meta.logMessages) {
//                                 const flipLogs = tx.meta.logMessages.filter((log) =>
//                                     log.includes("ROLL_RESULT")
//                                 );

//                                 if (flipLogs.length > 0) {

//                                     // Extract the relevant parts using a regular expression
//                                     const match = flipLogs[0].match(
//                                         /ROLL_RESULT: (\d+) for player: ([\w.]+) who guessed: (\d+) with wager: (\d+)/
//                                     );

//                                     if (!match) {
//                                         throw new Error(`Log format invalid: ${flipLogs[0]}`);
//                                     }

//                                     // Destructure the matched groups
//                                     const [, numberRolled, playerAddress, guess, wager] = match;

//                                     // Determine if the player won or lost
//                                     const wonOrLost = numberRolled === guess ? "won" : "lost";

//                                     // Return the parsed data as an object


//                                     const logData = {
//                                         playerAddress,
//                                         wager: parseInt(wager, 10),
//                                         guess: parseInt(guess, 10),
//                                         numberRolled: parseInt(numberRolled, 10),
//                                         wonOrLost,
//                                         blocktime: tx.blockTime,
//                                         blockTimeAgo: calculateTimeAgo(tx.blockTime)
//                                     };

//                                     // logs.push(logData);

//                                     console.log("old data: ", logHistoryData)
//                                     // setLogHistoryData([...logHistoryData, logData])

//                                     setLogHistoryData((prevLogHistoryData: any) => [...prevLogHistoryData, logData]);

//                                     console.log("new data: ", logData)
//                                 }
//                             }
//                         }
//                     }, 600 * index)

//                 }


//                 return 4;
//             }

//             getHistoryLogs(connection, pid);

//         } catch (error) {
//             console.error('Error initializing program:', error);
//             setError('Failed to initialize program');
//         }
//     };

//     function calculateTimeAgo(blockTime?: number | null): string {
//         if (!blockTime) return "";
    
//         // Get the current time in milliseconds
//         const now = Date.now();
    
//         // Ensure blockTime is in milliseconds (convert from seconds if needed)
//         if (blockTime < 1e12) {
//             blockTime *= 1000; // Convert seconds to milliseconds
//         }
    
//         // Calculate the difference in milliseconds
//         const timeDifference = now - blockTime;
    
//         // Convert to different units of time
//         const minutesAgo = Math.floor(timeDifference / (1000 * 60));
//         const hoursAgo = Math.floor(timeDifference / (1000 * 60 * 60));
//         const daysAgo = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
//         const weeksAgo = Math.floor(daysAgo / 7);
//         const monthsAgo = Math.floor(daysAgo / 30); // Approximation
//         const yearsAgo = Math.floor(daysAgo / 365); // Approximation
    
//         // Return a human-readable string based on time differences
//         if (minutesAgo < 60) {
//             return minutesAgo === 0
//                 ? "just now"
//                 : `${minutesAgo} minute${minutesAgo === 1 ? "" : "s"} ago`;
//         } else if (hoursAgo < 24) {
//             return `${hoursAgo} hour${hoursAgo === 1 ? "" : "s"} ago`;
//         } else if (daysAgo <= 14) {
//             return `${daysAgo} day${daysAgo === 1 ? "" : "s"} ago`;
//         } else if (weeksAgo <= 8) {
//             return `${weeksAgo} week${weeksAgo === 1 ? "" : "s"} ago`;
//         } else if (monthsAgo <= 24) {
//             return `${monthsAgo} month${monthsAgo === 1 ? "" : "s"} ago`;
//         } else {
//             return `${yearsAgo} year${yearsAgo === 1 ? "" : "s"} ago`;
//         }
//     }
    

//     const connectWallet = async () => {
//         try {
//             const { solana } = window;

//             if (solana) {


//                 console.log("real net")
//                 console.log(window.solana.rpcEndpoint)


//                 const response = await solana.connect();
//                 console.log("Connected with public key:", response.publicKey.toString());
//                 console.log("real net")
//                 console.log(window.solana.rpcEndpoint)
//                 console.log(window.solana)
//                 console.log(window.solana.connection)
//                 console.log(response)
//                 console.log(window)

//                 try {
//                     const connection = new Connection(clusterApiUrl("devnet"), {
//                         commitment: "confirmed",

//                     });
//                     // const programId = new PublicKey('9zYgmAvDrAi64rLuThmCTGF5StSwiRooV3e5k4nd7AAP');
//                     const programId = new PublicKey('9zYgmAvDrAi64rLuThmCTGF5StSwiRooV3e5k4nd7AAP');

//                     const playerStatePDA = await derivePlayerStatePDA(response.publicKey, programId);

//                     // Get the account info
//                     const accountInfo = await connection.getAccountInfo(playerStatePDA);

//                     if (accountInfo === null) {
//                         console.log("Account doesn't exist...");

//                         setAccountExistence(false);

//                     }
//                     else {
//                         console.log("Account exists!!");
//                         console.log(accountInfo)
//                         setAccountExistence(true);
//                     }

//                 } catch (error) {
//                     console.error("Error checking account:", error);
//                     return false;
//                 }

//                 setConnectedAddress(response.publicKey.toString())

//             } else {
//                 console.error("Phantom Wallet not available");
//             }
//         } catch (error) {
//             console.error("Error connecting to wallet:", error);
//         }
//     };


//     return (
//         <div>

//             <br />

//             {/* <WalletMultiButton /> */}

//             <i style={{ fontSize: "14px" }}>
//                 Note: devnet is currently the only supported network!
//                 <br />
//                 <br />
//             </i>


//             <h1>Die Roller</h1>

//             <div>

//                 <img src={dieRollImg} width="40px" />
//                 <br />
//                 <br />

//                 <p>
//                     Guess a number and roll the die!
//                 </p>
//                 <p>
//                     Every correct guess wins 5.2x!
//                 </p>

//                 {connectedAddress && <div>
//                     <br />
//                     <br />
//                     <i>

//                         {"Connected wallet: "}
//                         <a href={"https://solscan.io/account/" + connectedAddress + "?cluster=devnet"}>{connectedAddress.slice(0, 5) + '...' + connectedAddress.slice(connectedAddress.length - 6, connectedAddress.length - 1)}</a>
//                     </i>
//                 </div>
//                 }


//                 {!connectedAddress &&
//                     <>
//                         <br />
//                         <button
//                             type="submit"
//                             style={{
//                                 margin: "20px",
//                                 fontSize: "24px",
//                                 padding: "15px 30px",
//                                 borderRadius: "10px",
//                                 background: "linear-gradient(145deg, #ff9800, #ffc107)",
//                                 color: "#fff",
//                                 fontWeight: "bold",
//                                 border: "none",
//                                 boxShadow: "0 6px #d17b00",
//                                 cursor: "pointer",
//                                 transition: "transform 0.2s, box-shadow 0.2s",
//                             }}
//                             onClick={async (_e: any) => {

//                                 connectWallet()

//                             }}
//                             onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
//                                 const button = e.currentTarget; // Explicitly an HTMLButtonElement
//                                 button.style.transform = "translateY(4px)";
//                                 button.style.boxShadow = "0 2px #d17b00";
//                             }}
//                             onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
//                                 const button = e.currentTarget; // Explicitly an HTMLButtonElement
//                                 button.style.transform = "translateY(0)";
//                                 button.style.boxShadow = "0 6px #d17b00";
//                             }}
//                         >
//                             Connect wallet
//                         </button>
//                         <br />
//                     </>}


//                 <br />
//                 <br />

//                 <label>
//                     Your Guess:&nbsp;
//                 </label>
//                 <input
//                     className="guess-input"
//                     value={guessInputValue.toString().replace(/^0+/, '')}
//                     onChange={handleChange}
//                     inputMode="numeric"
//                     type="text" min="0" max="100" step="1" placeholder="-"

//                 />

//                 <br />
//                 {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
//                 <br />

//                 <br />
//                 {/* {rollResult != "" && <p style={{ color: "white", marginTop: "10px" }}>{rollResult}</p>} */}
//                 <p>The bet size is currently fixed at: 0.01 Sol</p>
//                 <br />
//                 {rollResult != "" &&
//                     <>
//                         <br />
//                         <p style={{ color: "white", marginTop: "10px" }}>{rollResult}</p>
//                         <br />
//                     </>}

//                 {rollResultComment != "" &&

//                     <>
//                         <br />
//                         <p style={{ color: "white", marginTop: "10px" }}>{rollResultComment}</p>
//                         <br />
//                     </>}


//                 {!accountExistence && connectedAddress &&
//                     <p>Please sign an "initialization" transaction to enable rolls with this address.</p>}

//                 {connectedAddress && <>

//                     {/* <br /> */}
//                     <button
//                         type="submit"
//                         style={{
//                             margin: "20px",
//                             fontSize: "24px",
//                             padding: "15px 30px",
//                             borderRadius: "10px",
//                             background: "linear-gradient(145deg, #ff9800, #ffc107)",
//                             color: "#fff",
//                             fontWeight: "bold",
//                             border: "none",
//                             boxShadow: "0 6px #d17b00",
//                             cursor: "pointer",
//                             transition: "transform 0.2s, box-shadow 0.2s",
//                         }}
//                         onClick={async (_e: any) => {

//                             if (guessInputValue < 1 || guessInputValue > 6) {
//                                 setError("Please enter a number between 1 and 6.");
//                             } else {
//                                 setError("");
//                                 setRollResultComment("");
//                                 console.log("Roll button clicked! Guessing: ", guessInputValue);

//                                 // await initializeProgram();

//                                 // const result = await startRoll(+guessInputValue, setRollResult, setRollResultComment, accountExistence, setAccountExistence, 10_000_000);
//                                 const result = await startRoll(+guessInputValue, setRollResult, setRollResultComment, player_state, setAccountExistence, 10_000_000);

//                                 // setRollResult(result)
//                             }

//                         }}
//                         onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
//                             const button = e.currentTarget; // Explicitly an HTMLButtonElement
//                             button.style.transform = "translateY(4px)";
//                             button.style.boxShadow = "0 2px #d17b00";
//                         }}
//                         onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
//                             const button = e.currentTarget; // Explicitly an HTMLButtonElement
//                             button.style.transform = "translateY(0)";
//                             button.style.boxShadow = "0 6px #d17b00";
//                         }}
//                     >
//                         Roll
//                     </button>


//                     <button
//                         type="submit"
//                         style={{
//                             margin: "20px",
//                             fontSize: "24px",
//                             padding: "15px 30px",
//                             borderRadius: "10px",
//                             background: "linear-gradient(145deg, #ff9800, #ffc107)",
//                             color: "#fff",
//                             fontWeight: "bold",
//                             border: "none",
//                             boxShadow: "0 6px #d17b00",
//                             cursor: "pointer",
//                             transition: "transform 0.2s, box-shadow 0.2s",
//                         }}
//                         onClick={async (_e: any) => {

//                             if (guessInputValue < 1 || guessInputValue > 6) {
//                                 setError("Please enter a number between 1 and 6.");
//                             } else {
//                                 setError("");
//                                 setRollResultComment("");
//                                 console.log("init global clicked");





//                                 console.log("in wallet sign");





//                                 const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

//                                 // Create the wallet provider (you might use Phantom or Sollet wallet in production)
//                                 const wallet = (window as any).solana; // Assuming Phantom wallet
//                                 // setWallet(wallet);

//                                 if (wallet) {
//                                     // Set up the Anchor provider
//                                     // const provider = new AnchorProvider(connection, wallet, {
//                                     //     preflightCommitment: "processed",
//                                     // });

//                                     const wallet = window.solana; // Assuming Phantom wallet

//                                     const provider = new AnchorProvider(connection, wallet, {
//                                         preflightCommitment: "processed",
//                                     });

//                                     if (!provider || !provider.connection) {
//                                         console.log("Wallet is not connected");
//                                         // You may need to prompt the user to connect their wallet
//                                         // await provider.wallet.publicKey;
//                                     }

//                                     if (!provider.publicKey) {
//                                         console.log("PublicKey is not available");

//                                         await window.solana.connect();
//                                     } else {
//                                         console.log("Wallet PublicKey: ", provider.publicKey.toString());
//                                     }
//                                     // Ensure this matches your deployed program's ID
//                                     // const programId = new PublicKey("YourProgramPublicKey");

//                                     // setProvider(provider);

//                                     console.log("wallet: ", wallet);
//                                     console.log("provider: ", provider);



//                                     const programId = new PublicKey('9zYgmAvDrAi64rLuThmCTGF5StSwiRooV3e5k4nd7AAP');
//                                     // const programId = new PublicKey('9zYgmAvDrAi64rLuThmCTGF5StSwiRooV3e5k4nd7AAP');

//                                     const idl = (await Program.fetchIdl(programId, provider))!;

//                                     // console.log("idl: ", JSON.stringify(idl, null, 2))
//                                     // console.log("idl: ", idl.version)
//                                     // console.log("idl: ", idl.instructions)

//                                     // Validate required IDL fields
//                                     // if (!idl.version || !idl.instructions) {
//                                     //     throw new Error("Invalid IDL format - missing required fields");
//                                     // }

//                                     try {
//                                         // const program = new Program(idl, programId, provider);
//                                         // // const program = new Program(idl, programId, provider);
//                                         // console.log("Program initialized:", program);
//                                         // console.log("program: ", program)

//                                         const programId = new PublicKey('9zYgmAvDrAi64rLuThmCTGF5StSwiRooV3e5k4nd7AAP');
//                                         // const programId = new PublicKey('9zYgmAvDrAi64rLuThmCTGF5StSwiRooV3e5k4nd7AAP');

//                                         // Use Program.at() instead of fetchIdl
//                                         // const program = await Program.at(programId, provider);
//                                         // console.log("Program initialized successfully:", program);



//                                         const programID = new PublicKey(idl.address);
//                                         const network = "https://api.devnet.solana.com"; // Adjust for your environment: local, devnet, or mainnet-beta

//                                         // const App = () => {
//                                         // const { connected } = useWallet();
//                                         // const [greetingAccountPublicKey, setGreetingAccountPublicKey] =
//                                         //     useState(null);
//                                         // const [error, setError] = useState("");

//                                         const getProvider = () => {
//                                             const opts = { preflightCommitment: COMMITMENT };
//                                             if (!wallet) return null;
//                                             const connection = new Connection(network, "processed");
//                                             return new AnchorProvider(connection, wallet, opts as ConfirmOptions);
//                                         };

//                                         // const createGreeting = async () => {
//                                         // setError("");
//                                         // if (!connected) {
//                                         // console.log("Wallet is not connected.");

//                                         // return;
//                                         // }

//                                         console.log("getting provider")

//                                         const provider = getProvider();
//                                         if (!provider) {
//                                             console.log("Provider is not available.");
//                                             // return;
//                                         }
//                                         else {

//                                             console.log("idl: ", idl)
//                                             console.log("programID: ", programID)
//                                             console.log("provider: ", provider)

//                                             // const transformedIdl: Idl = {
//                                             //     version: idl.metadata.version,
//                                             //     name: idl.metadata.name,
//                                             //     instructions: idl.instructions,
//                                             //     accounts: idl.accounts,
//                                             //     types: idl.types,
//                                             //     events: idl.events,
//                                             //     errors: idl.errors,
//                                             // };

//                                             const program = new Program(idl, provider);
//                                             // console.log("program created!");
//                                             console.log(program);





//                                             const [playerStateAccount, playerStateAccountbump] = PublicKey.findProgramAddressSync(
//                                                 [Buffer.from(PLAYER_STATE_SEED), provider.publicKey.toBuffer()],
//                                                 program.programId
//                                             );
//                                             console.log("playerStateAccount: ", playerStateAccount.toString())

//                                             const [gameStateAccount, gameStateAccountbump] = PublicKey.findProgramAddressSync(
//                                                 [Buffer.from(GAME_STATE_SEED)],
//                                                 program.programId
//                                             );
//                                             console.log("gameStateAccount: ", gameStateAccount.toString())

//                                             const initIx = await program.methods
//                                                 .initializeGame()
//                                                 .accounts({
//                                                     gameState: gameStateAccount,
//                                                     // playerState: playerStateAccount,
//                                                     // escrowAccount: escrowAccount,
//                                                     user: provider.publicKey,
//                                                     systemProgram: SystemProgram.programId,
//                                                 })
//                                                 .instruction();


//                                             const txOpts = {
//                                                 commitment: "processed" as Commitment,
//                                                 skipPreflight: true,
//                                                 maxRetries: 0,
//                                             };
//                                             try {
//                                                 const transaction = new Transaction().add(initIx);

//                                                 transaction.feePayer = provider.publicKey;
//                                                 transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

//                                                 const signedTransaction = await wallet.signTransaction(transaction);

//                                                 const txId = await connection.sendRawTransaction(signedTransaction.serialize(), {
//                                                     skipPreflight: true,
//                                                     preflightCommitment: "confirmed"
//                                                 });

//                                                 console.log("Transaction sent:", txId);

//                                                 // Confirm transaction
//                                                 await connection.confirmTransaction(txId, "confirmed");
//                                                 console.log("Transaction confirmed!");


//                                                 // setAccountExistence(true)

//                                             }
//                                             catch (err) {
//                                                 console.error(err)
//                                             }
//                                         }

//                                     }

//                                     // }
//                                     catch (err) {
//                                         console.error(err)
//                                     }
//                                 }
//                             }
//                         }
//                         }
//                         onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
//                             const button = e.currentTarget; // Explicitly an HTMLButtonElement
//                             button.style.transform = "translateY(4px)";
//                             button.style.boxShadow = "0 2px #d17b00";
//                         }}
//                         onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
//                             const button = e.currentTarget; // Explicitly an HTMLButtonElement
//                             button.style.transform = "translateY(0)";
//                             button.style.boxShadow = "0 6px #d17b00";
//                         }}
//                     >
//                         Init Game
//                     </button>
//                 </>}

//             </div>


//             {/* Recent Rolls */}
//             <br />
//             <br />
//             <br />
//             <br />

//             <LogHistory data={logHistoryData} />

//             <br />
//             <br />
//             <br />
//             {/* <pre>

//                 {JSON.stringify(logHistoryData, null, 2)}
//             </pre>  */}

//             {/* <div className="LogHistory">
//                 <div className="table-container">
//                     <h2 className="table-title">Recent Rolls</h2>
//                     <table className="recent-rolls-table">
//                         <tbody>
//                             {logHistoryData.map((item: LogHistoryData, index: number) => (
//                                 <tr key={index} className="table-row">
//                                     <td className="left-column">foo, {item.wonOrLost}</td>
//                                     <td className="right-column">{item.blockTimeAgo}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div> */}

//         </div>
//     );
// }

// export default DieRoll;

// const derivePlayerStatePDA = async (userPublicKey: PublicKey, programId: PublicKey) => {
//     const [playerState] = await PublicKey.findProgramAddress(
//         [
//             Buffer.from('playerState'),
//             userPublicKey.toBuffer()
//         ],
//         programId
//     );
//     return playerState;
// };

