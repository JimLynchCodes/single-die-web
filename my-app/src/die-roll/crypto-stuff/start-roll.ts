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
import { AnchorProvider, Program, web3 } from "@project-serum/anchor";

const PLAYER_STATE_SEED = "playerState";
const ESCROW_SEED = "stateEscrow";
// const COMMITMENT = "confirmed";
const COMMITMENT = "finalized";

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
                const provider = new AnchorProvider(connection, wallet, {
                    preflightCommitment: "processed",
                });
                // setProvider(provider);

                console.log("wallet: ", wallet);
                console.log("provider: ", provider);

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
async function startRollg(userGuess: number): Promise<number> {
    console.clear();
    const { keypair, connection, program } = await sb.AnchorUtils.loadEnv();
    console.log("\nSetup...");
    console.log("Program", program!.programId.toString());

    console.log("guess is", userGuess);
    let queue = await setupQueue(program!);
    console.log("queue: ", queue);
    const myProgram = await initializeMyProgram(program!.provider);
    console.log("my program: ", queue);
    const sbProgram = await loadSbProgram(program!.provider);
    console.log("switchboard program: ", queue);
    const txOpts = {
        commitment: "processed" as Commitment,
        skipPreflight: false,
        maxRetries: 0,
    };

    // create randomness account and initialise it
    const rngKp = Keypair.generate();
    const [randomness, ix] = await sb.Randomness.create(sbProgram, rngKp, queue);
    console.log("\nCreated randomness account..");
    console.log("Randomness account", randomness.pubkey.toString());

    const createRandomnessTx = await sb.asV0Tx({
        connection: sbProgram.provider.connection,
        ixs: [ix],
        payer: keypair.publicKey,
        signers: [keypair, rngKp],
        computeUnitPrice: 75_000,
        computeUnitLimitMultiple: 1.3,
    });

    const sim = await connection.simulateTransaction(createRandomnessTx, txOpts);
    const sig1 = await connection.sendTransaction(createRandomnessTx, txOpts);
    await connection.confirmTransaction(sig1, COMMITMENT);
    console.log(
        "  Transaction Signature for randomness account creation: ",
        sig1
    );

    // initilise example program accounts
    const playerStateAccount = await PublicKey.findProgramAddressSync(
        [Buffer.from(PLAYER_STATE_SEED), keypair.publicKey.toBuffer()],
        sbProgram.programId
    );
    // Find the escrow account PDA and initliaze the game
    const [escrowAccount, escrowBump] = await PublicKey.findProgramAddressSync(
        [Buffer.from(ESCROW_SEED)],
        myProgram.programId
    );
    console.log("\nInitialize the game states...");
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

    // Commit to randomness Ix
    console.log("\nSubmitting Guess...");
    const commitIx = await randomness.commitIx(queue);

    // Create coinFlip Ix
    const coinFlipIx = await createCoinFlipInstruction(
        myProgram,
        rngKp.publicKey,
        userGuess,
        playerStateAccount,
        keypair,
        escrowAccount
    );

    const commitTx = await sb.asV0Tx({
        connection: sbProgram.provider.connection,
        ixs: [commitIx, coinFlipIx],
        payer: keypair.publicKey,
        signers: [keypair],
        computeUnitPrice: 75_000,
        computeUnitLimitMultiple: 1.3,
    });

    const sim4 = await connection.simulateTransaction(commitTx, txOpts);
    const sig4 = await connection.sendTransaction(commitTx, txOpts);
    await connection.confirmTransaction(sig4, COMMITMENT);
    // console.log("  Transaction Signature commitTx", sig4);
    console.log("Guess Transaction Confirmed!  ✅");

    // setTimeout(async () => {

    console.log("\nReveal the randomness...");
    const revealIx = await randomness.revealIx();

    const settleFlipIx = await settleFlipInstruction(
        myProgram,
        escrowBump,
        playerStateAccount,
        rngKp.publicKey,
        escrowAccount,
        keypair
    );
    // console.log("settleFlipIx: ", settleFlipIx)

    const revealTx = await sb.asV0Tx({
        connection: sbProgram.provider.connection,
        ixs: [revealIx, settleFlipIx],
        payer: keypair.publicKey,
        signers: [keypair],
        computeUnitPrice: 75_000,
        computeUnitLimitMultiple: 1.3,
    });


    const sim5 = await connection.simulateTransaction(revealTx, txOpts);
    const sig5 = await connection.sendTransaction(revealTx, txOpts);
    await connection.confirmTransaction(sig5, COMMITMENT);
    // console.log("  Transaction Signature revealTx", sig5);
    console.log("Reveal Transaction Confirmed!  ✅");

    const answer = await connection.getParsedTransaction(sig5, {
        maxSupportedTransactionVersion: 0,
    });
    let resultLog = answer?.meta?.logMessages?.filter((line) =>
        line.includes("FLIP_RESULT")
    )[0];
    let result = resultLog?.split(": ")[2];

    console.log("\nYou guessed: ", userGuess);

    if (result) {


        console.log(`\The number rolled is: ... ${result}!`);


        if (userGuess === +result) {
            console.log('You won!')
        }
        else {
            console.log('Better luck next time.')
        }

        return +result;
    }

    console.log("Couldn't parse result...");

    return 0;

};

export default startRoll;