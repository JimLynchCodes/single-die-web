// import * as anchor from "@coral-xyz/anchor";
import {
    Connection,
    PublicKey,
    Keypair,
    SystemProgram,
    Commitment,
    clusterApiUrl,
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


async function startRoll(userGuess: number): Promise<number> {

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


                startRollg(program, wallet.keypair, connection, wallet, userGuess)
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
async function startRollg(program: any, keypair: Keypair, connection: Connection, wallet: Wallet, userGuess: number): Promise<number> {
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




    // // Create randomness
    // const [randomness, ix] = await sb.Randomness.create(
    //     program,
    //     rngKp,
    //     queue,
    //     wallet.publicKey, // Use the user's public key as the authority
    //     /* ... other arguments as needed */
    // );

    // const txOpts = {
    //     commitment: "processed" as Commitment,
    //     skipPreflight: false,
    //     maxRetries: 0,
    //   };

    // create randomness account and initialise it
    //   const rngKp = Keypair.generate();
    const [randomness, ix] = await sb.Randomness.create(sbProgram, rngKp, queue);
    console.log("\nCreated randomness account..");
    console.log(randomness);
    console.log(ix);
    //   console.log("Randomness account", randomness.pubkey.toString());
    
    
    console.log(sbProgram.provider.connection);
    console.log(wallet.publicKey);
    console.log(keypair);
    console.log(rngKp);


    // async function getPayerKeypair(provider: any): Promise<Keypair> {
    //     if (provider.publicKey) {
    //         const secretKey = await provider.request({
    //             method: "solana_requestAccounts",
    //         });
    //         return Keypair.fromSecretKey(new Uint8Array(secretKey[0].secretKey));  // Assuming your wallet provides this data
    //     } else {
    //         throw new Error("No public key available.");
    //     }
    // }

    // const payerKeypair = await getPayerKeypair(); 

    console.log(wallet.payer)
    console.log(wallet.publicKey)
    console.log(rngKp)

    // const createRandomnessTx = await sb.asV0Tx({
    //     connection: sbProgram.provider.connection,
    //     ixs: [ix],
    //     payer: wallet.publicKey,
    //     signers: [rngKp],
    //     computeUnitPrice: 75_000,
    //     computeUnitLimitMultiple: 1.3,
    // });
    const createRandomnessTx = await sb.asV0Tx({
        connection: sbProgram.provider.connection,
        ixs: [ix],
        payer: wallet.publicKey,
        signers: [rngKp],
        // computeUnitPrice: 75_000,
        // computeUnitLimitMultiple: 1.3,
    });

    console.log("createRandomnessTx: ", createRandomnessTx);

    if (wallet.signTransaction) {
        console.log('signing transaction');
        const signedTx = await wallet.signTransaction(createRandomnessTx);
        console.log('signed', signedTx);
    
        try {
            // Simulate the signed transaction to check if it's valid
            const sim = await connection.simulateTransaction(signedTx, txOpts);
            console.log("Simulation result: ", sim);
    
            // Send the signed transaction
            const sig1 = await connection.sendTransaction(signedTx, txOpts);
            await connection.confirmTransaction(sig1, COMMITMENT);
            console.log("Transaction Signature: ", sig1);
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

    // // initilise example program accounts
    // const playerStateAccount = await PublicKey.findProgramAddressSync(
    //     [Buffer.from(PLAYER_STATE_SEED), keypair.publicKey.toBuffer()],
    //     sbProgram.programId
    // );
    // // Find the escrow account PDA and initliaze the game
    // const [escrowAccount, escrowBump] = await PublicKey.findProgramAddressSync(
    //     [Buffer.from(ESCROW_SEED)],
    //     program.programId
    // );
    // console.log("\nInitialize the game states...");
    // await initializeGame(
    //   myProgram,
    //   playerStateAccount,
    //   escrowAccount,
    //   keypair,
    //   sbProgram,
    //   connection
    // );
    // await ensureEscrowFunded(
    //   connection,
    //   escrowAccount,
    //   keypair,
    //   sbProgram,
    //   txOpts
    // );

    // // Commit to randomness Ix
    // console.log("\nSubmitting Guess...");
    // const commitIx = await randomness.commitIx(queue);

    // // Create coinFlip Ix
    // const coinFlipIx = await createCoinFlipInstruction(
    //     myProgram,
    //     rngKp.publicKey,
    //     userGuess,
    //     playerStateAccount,
    //     keypair,
    //     escrowAccount
    // );

    // const commitTx = await sb.asV0Tx({
    //     connection: sbProgram.provider.connection,
    //     ixs: [commitIx, coinFlipIx],
    //     payer: keypair.publicKey,
    //     signers: [keypair],
    //     computeUnitPrice: 75_000,
    //     computeUnitLimitMultiple: 1.3,
    // });

    // const sim4 = await connection.simulateTransaction(commitTx, txOpts);
    // const sig4 = await connection.sendTransaction(commitTx, txOpts);
    // await connection.confirmTransaction(sig4, COMMITMENT);
    // // console.log("  Transaction Signature commitTx", sig4);
    // console.log("Guess Transaction Confirmed!  ✅");

    // // setTimeout(async () => {

    // console.log("\nReveal the randomness...");
    // const revealIx = await randomness.revealIx();

    // const settleFlipIx = await settleFlipInstruction(
    //     myProgram,
    //     escrowBump,
    //     playerStateAccount,
    //     rngKp.publicKey,
    //     escrowAccount,
    //     keypair
    // );
    // // console.log("settleFlipIx: ", settleFlipIx)

    // const revealTx = await sb.asV0Tx({
    //     connection: sbProgram.provider.connection,
    //     ixs: [revealIx, settleFlipIx],
    //     payer: keypair.publicKey,
    //     signers: [keypair],
    //     computeUnitPrice: 75_000,
    //     computeUnitLimitMultiple: 1.3,
    // });


    // const sim5 = await connection.simulateTransaction(revealTx, txOpts);
    // const sig5 = await connection.sendTransaction(revealTx, txOpts);
    // await connection.confirmTransaction(sig5, COMMITMENT);
    // // console.log("  Transaction Signature revealTx", sig5);
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

    // console.log("Couldn't parse result...");

    return 0;

};

export default startRoll;