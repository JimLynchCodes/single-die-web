// import * as anchor from "@coral-xyz/anchor";
import {
    Connection,
    PublicKey,
    Keypair,
    SystemProgram,
    Commitment,
    clusterApiUrl,
    Transaction,
} from "@solana/web3.js";
import * as sb from "@switchboard-xyz/on-demand";
import { initializeGame, loadSbProgram } from "./utils";
import { setupQueue } from "./utils";
import { initializeMyProgram } from "./utils";
import { createCoinFlipInstruction } from "./utils";
import { settleFlipInstruction } from "./utils";
import { ensureEscrowFunded } from "./utils";
// import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import idl from '../../sb_randomness.json';
import { AnchorProvider, Idl, Program, Wallet } from "@coral-xyz/anchor";


const PLAYER_STATE_SEED = "playerState";
const ESCROW_SEED = "stateEscrow";
// const COMMITMENT = "confirmed";
const COMMITMENT = "finalized" as Commitment;


async function startRoll(userGuess: number, setRollResult: React.Dispatch<React.SetStateAction<number>>): Promise<number> {

    // const { keypair, connection, program } = await sb.AnchorUtils.loadEnv();
    // console.log({ keypair, connection, program })


    // Anchor program ID (replace with your program's ID)
    // const programId = new web3.PublicKey("YourProgramPublicKey");

    // export const useAnchor = () => {
    // const [provider, setProvider] = useState(null);
    // const [program, setProgram] = useState(null);
    // const [wallet, setWallet] = useState(null);

    // useEffect(() => {
    // Set up the Solana connection (e.g., to devnet)
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // Create the wallet provider (you might use Phantom or Sollet wallet in production)
    const wallet = (window as any).solana; // Assuming Phantom wallet
    // setWallet(wallet);

    if (wallet) {
        // Set up the Anchor provider
        // const provider = new AnchorProvider(connection, wallet, {
        //     preflightCommitment: "processed",
        // });

        const wallet = window.solana; // Assuming Phantom wallet

        const provider = new AnchorProvider(connection, wallet, {
            preflightCommitment: "processed",
        });

        if (!provider || !provider.connection) {
            console.log("Wallet is not connected");
            // You may need to prompt the user to connect their wallet
            // await provider.wallet.publicKey;
        }

        if (!provider.publicKey) {
            console.log("PublicKey is not available");

            await window.solana.connect();
        } else {
            console.log("Wallet PublicKey: ", provider.publicKey.toString());
        }
        // Ensure this matches your deployed program's ID
        // const programId = new PublicKey("YourProgramPublicKey");

        // setProvider(provider);

        console.log("wallet: ", wallet);
        console.log("provider: ", provider);



        const programId = new PublicKey('3gHtqUaKGu3RJCWVbgQFd5Gv4MQfQKmQjKSvdejkLoA7');

        const idl = (await Program.fetchIdl(programId, provider))!;

        // console.log("idl: ", JSON.stringify(idl, null, 2))
        // console.log("idl: ", idl.version)
        // console.log("idl: ", idl.instructions)

        // Validate required IDL fields
        // if (!idl.version || !idl.instructions) {
        //     throw new Error("Invalid IDL format - missing required fields");
        // }

        try {
            // const program = new Program(idl, programId, provider);
            // // const program = new Program(idl, programId, provider);
            // console.log("Program initialized:", program);
            // console.log("program: ", program)

            const programId = new PublicKey('3gHtqUaKGu3RJCWVbgQFd5Gv4MQfQKmQjKSvdejkLoA7');

            // Use Program.at() instead of fetchIdl
            // const program = await Program.at(programId, provider);
            // console.log("Program initialized successfully:", program);



            const programID = new PublicKey(idl.address);
            const network = "https://api.devnet.solana.com"; // Adjust for your environment: local, devnet, or mainnet-beta

            // const App = () => {
            // const { connected } = useWallet();
            // const [greetingAccountPublicKey, setGreetingAccountPublicKey] =
            //     useState(null);
            // const [error, setError] = useState("");

            const getProvider = () => {
                const opts = { preflightCommitment: COMMITMENT };
                if (!wallet) return null;
                const connection = new Connection(network, "processed");
                return new AnchorProvider(connection, wallet, opts);
            };

            // const createGreeting = async () => {
            // setError("");
            // if (!connected) {
            // console.log("Wallet is not connected.");

            // return;
            // }

            console.log("getting provider")

            const provider = getProvider();
            if (!provider) {
                console.log("Provider is not available.");
                // return;
            }
            else {

                console.log("idl: ", idl)
                console.log("programID: ", programID)
                console.log("provider: ", provider)

                // const transformedIdl: Idl = {
                //     version: idl.metadata.version,
                //     name: idl.metadata.name,
                //     instructions: idl.instructions,
                //     accounts: idl.accounts,
                //     types: idl.types,
                //     events: idl.events,
                //     errors: idl.errors,
                // };

                const program = new Program(idl, provider);
                // console.log("program created!");
                console.log(program);


                return await startRollg(program, wallet.keypair, connection, wallet, userGuess, setRollResult)
            }
            // try {
            //     const greetingAccount = Keypair.generate();
            //     await program.rpc.createGreeting({
            //         accounts: {
            //             greetingAccount: greetingAccount.publicKey,
            //             user: provider.wallet.publicKey,
            //             systemProgram: SystemProgram.programId,
            //         },
            //         signers: [greetingAccount],
            //     });
            // setGreetingAccountPublicKey(greetingAccount.publicKey.toString());
            // } catch (err) {
            //     console.error("Error creating greeting account:", err);
            //     console.log("Failed to create greeting account. Please try again.");
            // }
            // };

        } catch (error) {
            console.error("Error initializing program:", error);
        }

        // Set up the program (anchor program from IDL)
        // const program = new Program(idl, programId, provider);
        // setProgram(program);
    }
    // }, []);

    // console.log({ provider, program, wallet });
    // return { provider, program, wallet };
    // };


    return 2;
}

/// takes a guess, calls to blockchain, returns the result.
async function startRollg(program: any, keypair: Keypair, connection: Connection, wallet: Wallet, userGuess: number, setRollResult: React.Dispatch<React.SetStateAction<number>>): Promise<number> {
    // console.clear();
    // const { keypair, connection, program } = await sb.AnchorUtils.loadEnv();
    // console.log("\nSetup...");
    // console.log("Program", program!.programId.toString());

    // console.log("guess is", userGuess);
    let queue = await setupQueue(program);
    console.log("queue: ", queue);
    // const myProgram = await initializeMyProgram(program!.provider);
    console.log("my program: ", program);
    const sbProgram = await loadSbProgram(program.provider);
    console.log("switchboard program: ", sbProgram);
    const txOpts = {
        commitment: "processed" as Commitment,
        skipPreflight: false,
        maxRetries: 0,
    };

    // create randomness account and initialise it
    const rngKp = Keypair.generate();

    console.log("rngKp: ", rngKp)
    console.log("sbProgram: ", sbProgram)
    console.log("queue: ", queue)


    // const connection2 = new Connection('https://api.devnet.solana.com'); // Replace with your desired endpoint

    // Assuming you have a program ID (sbProgram) and a randomness program keypair (rngKp)
    // const programId = new PublicKey('your_program_id');
    // const rngKp2 = Keypair.fromSecretKey(Uint8Array.from([/* ... your rngKp secret key */]));

    // Connect to Phantom wallet
    // const provider = window.solana;
    // const wallet2 = provider.wallet;

    // console.log("wallet2 ", wallet2)
    console.log("program ", program)
    console.log("rngKp ", rngKp)
    console.log("wallet ", wallet)
    console.log("queue ", queue)

    const userPublicKey = wallet.publicKey;
    console.log("wallet.publicKey ", userPublicKey)

    const [randomness, ix] = await sb.Randomness.create(sbProgram, rngKp, queue);
    console.log("\nCreated randomness account..");
    console.log(randomness);
    console.log(ix);

    console.log(sbProgram.provider.connection);
    console.log(wallet.publicKey);
    console.log(keypair);
    console.log(rngKp);

    console.log("payer: ", wallet.payer)
    console.log(wallet.publicKey)
    console.log(rngKp)

    const createRandomnessTx = await sb.asV0Tx({
        connection: sbProgram.provider.connection,
        ixs: [ix],
        payer: wallet.publicKey,
        signers: [rngKp],
        computeUnitPrice: 75_000,
        computeUnitLimitMultiple: 1.3,
    });

    console.log("createRandomnessTx: ", createRandomnessTx);

    if (wallet.signTransaction) {
        console.log('signing transaction');
        // const signedTx = await wallet.signTransaction(createRandomnessTx);

        try {
            // Simulate the signed transaction to check if it's valid
            // const sim = await connection.simulateTransaction(signedTx, txOpts);
            // console.log("Simulation result: ", sim);

            // // Send the signed transaction
            // const sig1 = await connection.sendTransaction(signedTx, txOpts);
            // await connection.confirmTransaction(sig1, COMMITMENT);
            // console.log("Transaction Signature: ", sig1);

            const signedRandomnessTransaction = await wallet.signTransaction(createRandomnessTx);
            console.log('signedRandomnessTransaction', signedRandomnessTransaction);

            const txId = await connection.sendRawTransaction(signedRandomnessTransaction.serialize(), {
                skipPreflight: true,
                preflightCommitment: "finalized"
            });

            console.log("signedRandomnessTransaction sent:", txId);

            // Confirm transaction
            await connection.confirmTransaction(txId, "finalized");
            console.log("signedRandomnessTransaction confirmed! ", txId);


            console.log("down here sb: ", sbProgram)

            // initilise example program accounts
            const [playerStateAccount, playerStateAccountbump] = await PublicKey.findProgramAddressSync(
                [Buffer.from(PLAYER_STATE_SEED), wallet.publicKey.toBuffer()],
                program.programId
            );
            console.log("playerStateAccount: ", playerStateAccount.toString())

            const [playerStateAccountSb, playerStateAccountSbbump] = await PublicKey.findProgramAddressSync(
                [Buffer.from(PLAYER_STATE_SEED), wallet.publicKey.toBuffer()],
                program.programId
                // sbProgram.programId
            );
            console.log("playerStateAccountSb: ", playerStateAccountSb.toString())

            // Find the escrow account PDA and initliaze the game
            const [escrowAccount, escrowBump] = await PublicKey.findProgramAddressSync(
                [Buffer.from(ESCROW_SEED)],
                program.programId
            );

            console.log("\nInitialize the game states...");
            console.log(playerStateAccount);
            console.log(escrowAccount);
            console.log(escrowBump);

            try {
                const accountInfo1 = await connection.getAccountInfo(playerStateAccount);

                if (!accountInfo1) {
                    console.log("Account does not exist.");
                    // return false;
                } else {

                    // You can check if the account has been initialized based on your program's requirements
                    // For example, you might check the data length or content
                    console.log("Account found. Data length:", accountInfo1.data.length);

                    // Perform a specific check for initialization
                    if (accountInfo1.data.length > 0) {
                        console.log("Account is initialized.");
                        // return true;
                    } else {
                        console.log("Account exists but is uninitialized.");
                        // return false;

                        await initializeGame(
                            program,
                            playerStateAccount,
                            escrowAccount,
                            sbProgram,
                            connection,
                            wallet
                        );
                    }


                    // Commit to randomness Ix
                    console.log("\nSubmitting Guess...");
                    const commitIx = await randomness.commitIx(queue);

                    // // Create coinFlip Ix
                    console.log("rngKp: ", rngKp)
                    console.log("program: ", program)
                    console.log("usergues: ", userGuess)
                    console.log("playerStateAccount: ", playerStateAccount)
                    // console.log("wallet.payer: ", wallet.payer)
                    console.log("escrowAccount: ", escrowAccount)

                    const coinFlipIx = await createCoinFlipInstruction(
                        program,
                        rngKp.publicKey,
                        userGuess,
                        playerStateAccount,
                        // wallet.payer,
                        escrowAccount,
                        wallet
                    );

                    console.log("coin flip ix: ", coinFlipIx)


                    // const transaction = new Transaction().add(coinFlipIx);

                    const commitTx = await sb.asV0Tx({
                        connection: sbProgram.provider.connection,
                        ixs: [commitIx, coinFlipIx],
                        payer: wallet.publicKey,
                        // signers: [keypair],
                        computeUnitPrice: 75_000,
                        computeUnitLimitMultiple: 1.3,
                    });

                    console.log('trying raw send')

                    // transaction.feePayer = wallet.publicKey;
                    // transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

                    const signedCommitTransaction = await wallet.signTransaction(commitTx);

                    const txId = await connection.sendRawTransaction(signedCommitTransaction.serialize(), {
                        skipPreflight: true,
                        preflightCommitment: "finalized"
                    });

                    console.log("Coin Flip Transaction sent:", txId);

                    // Confirm transaction
                    await connection.confirmTransaction(txId, "finalized");
                    // console.log("Coin Flip Transaction confirmed!");
                    console.log("Guess Transaction Confirmed!  ✅");


                    // setTimeout(async () => {

                    connection.onSignature(txId, async (_) => {

                        console.log(playerStateAccount.toString())

                        const accountInfo = await connection.getAccountInfo(playerStateAccount);
                        if (accountInfo) {
                            const accountData = accountInfo.data;
                            console.log("Account Data:", accountData);
                            console.log("Account Owner:", accountInfo?.owner.toBase58());
                            // Inspect whether the discriminator matches the expected value

                            console.log("\nReveal the randomness...", randomness);
                            const revealIx = await randomness.revealIx();
                            console.log("\nRandomness revealed! ", revealIx);


                            const settleFlipIx = await settleFlipInstruction(
                                program,
                                escrowBump,
                                playerStateAccount,
                                rngKp.publicKey,
                                escrowAccount,
                                wallet
                            );
                            console.log("settleFlipIx: ", settleFlipIx)

                            const revealTx = await sb.asV0Tx({
                                connection: sbProgram.provider.connection,
                                ixs: [revealIx, settleFlipIx],
                                payer: wallet.publicKey,
                                // signers: [wa],
                                computeUnitPrice: 75_000,
                                computeUnitLimitMultiple: 1.3,
                            });


                            // const sim5 = await connection.simulateTransaction(revealTx, txOpts);
                            // const sig5 = await connection.sendTransaction(revealTx, txOpts);
                            // await connection.confirmTransaction(sig5, COMMITMENT);






                            // const settleTransaction = new Transaction().add(settleFlipIx);

                            console.log('trying raw send')

                            // settleTransaction.feePayer = wallet.publicKey;
                            // settleTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

                            const signedRevealTransaction = await wallet.signTransaction(revealTx);

                            const settleTxId = await connection.sendRawTransaction(signedRevealTransaction.serialize(), {
                                skipPreflight: true,
                                preflightCommitment: "finalized",
                            });

                            console.log("Settle Transaction sent:", settleTxId);

                            // Confirm transaction
                            // const confirmResult = await connection.confirmTransaction(settleTxId, "finalized");


                            connection.onSignature(settleTxId, async confirmResult => {
                                console.log("Settle Transaction confirmed!  ✅");
                                console.log("confirmResult", confirmResult);


                                // setTimeout(async () => {


                                const answer = await connection.getParsedTransaction(settleTxId, {
                                    maxSupportedTransactionVersion: 0,
                                });

                                console.log("answer: ", answer)
                                console.log("answer logs: ", answer?.meta?.logMessages)

                                let resultLog = answer?.meta?.logMessages?.filter((line) =>
                                    line.includes("FLIP_RESULT")
                                )[0];

                                console.log(resultLog?.split(": ")[2])

                                let result = resultLog?.split(": ")[2] || -1;

                                console.log("\nYou guessed: ", userGuess);

                                console.log(`\The number rolled is: ... ${result}!`);


                                if (userGuess === +result) {
                                    console.log('You won!')
                                }
                                else {
                                    console.log('Better luck next time.')
                                }


                                setRollResult(+result)

                            })


                        } else {
                            console.error("Account not found or invalid");
                        }






                        // console.log("  Transaction Signature revealTx", sig5);
                        // console.log("Reveal Transaction Confirmed!  ✅");

                        // const answer = await connection.getParsedTransaction(sig5, {
                        //     maxSupportedTransactionVersion: 0,
                        // });
                        // let resultLog = answer?.meta?.logMessages?.filter((line) =>
                        //     line.includes("FLIP_RESULT")
                        // )[0];
                        // let result = resultLog?.split(": ")[2];

                        // console.log("\nYou guessed: ", userGuess);

                        // if (result) {


                        //     console.log(`\The number rolled is: ... ${result}!`);


                        //     if (userGuess === +result) {
                        //         console.log('You won!')
                        //     }
                        //     else {
                        //         console.log('Better luck next time.')
                        //     }

                        //     return +result;
                        // }


                    });
                }
            } catch (error) {
                console.error("Error checking account:", error);
                // return false;
            }




        } catch (err) {
            console.error("Transaction failed", err);
        }
    } else {
        console.error("Wallet signTransaction method not available");
    }

    // if (wallet.signTransaction) {
    //     console.log('signing transaction')
    //     const signed_tx = await wallet.signTransaction(createRandomnessTx);
    //     console.log('signed')
    //     console.log(signed_tx)

    //     try {

    //         const sim = await connection.simulateTransaction(createRandomnessTx, txOpts);
    //         const sig1 = await connection.sendTransaction(createRandomnessTx, txOpts);
    //         await connection.confirmTransaction(sig1, COMMITMENT);
    //         console.log(
    //             "  Transaction Signature for randomness account creation: ",
    //             sig1
    //         );
    //     }
    //     catch(err) {
    //         console.log(JSON.stringify(err, null, 2))
    //     }

    // }

    // const [randomness, ix] = await sb.Randomness.create(sbProgram, rngKp, queue, wallet.publicKey);
    // console.log("\nCreated randomness account..");
    // console.log(randomness);
    // console.log(ix);
    // console.log("Randomness account", randomness.pubkey.toString());

    // const createRandomnessTx = await sb.asV0Tx({
    //     connection: sbProgram.provider.connection,
    //     ixs: [ix],
    //     payer: keypair.publicKey,
    //     signers: [keypair, rngKp],
    //     computeUnitPrice: 75_000,
    //     computeUnitLimitMultiple: 1.3,
    // });

    // const sim = await connection.simulateTransaction(createRandomnessTx, txOpts);
    // const sig1 = await connection.sendTransaction(createRandomnessTx, txOpts);
    // await connection.confirmTransaction(sig1, COMMITMENT);
    // console.log(
    //     "  Transaction Signature for randomness account creation: ",
    //     sig1
    // );




    // console.log("Couldn't parse result...");

    return 0;

};

export default startRoll;