import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Idl, Program, Wallet, } from "@coral-xyz/anchor";
import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Commitment,
    Transaction,
} from "@solana/web3.js";
import * as sb from "@switchboard-xyz/on-demand";

const COMMITMENT = "confirmed";

export async function myAnchorProgram(
    provider: anchor.Provider,
    keypath: string
): Promise<anchor.Program> {

    console.log("keypath: ", keypath)
    const myProgramKeypair = await sb.AnchorUtils.initKeypairFromFile(keypath);
    console.log("myProgramKeypair: ", myProgramKeypair)
    const pid = myProgramKeypair.publicKey;
    console.log("pid: ", pid.toString())
    const idl = (await anchor.Program.fetchIdl(pid, provider))!;
    console.log("idl: ", idl)
    const program = new anchor.Program(idl, provider);
    return program;
}

export async function loadSbProgram(
    provider: anchor.Provider
): Promise<anchor.Program> {
    const sbProgramId = await sb.getProgramId(provider.connection);
    const sbIdl = await anchor.Program.fetchIdl(sbProgramId, provider);
    const sbProgram = new anchor.Program(sbIdl!, provider);
    return sbProgram;
}

export async function initializeMyProgram(
    provider: anchor.Provider
): Promise<anchor.Program> {
    const myProgramPath =
        "./target/deploy/sb_randomness-keypair.json";
    const myProgram = await myAnchorProgram(provider, myProgramPath);


    console.log("My user pub key", provider?.publicKey?.toString());
    console.log("My program", myProgram.programId.toString());
    return myProgram;
}

export async function setupQueue(program: anchor.Program): Promise<PublicKey> {
    const queueAccount = await sb.getDefaultQueue(
        program.provider.connection.rpcEndpoint
    );
    console.log("Queue account", queueAccount.pubkey.toString());
    try {
        await queueAccount.loadData();
    } catch (err) {
        console.error("Queue not found, ensure you are using devnet in your env");
        process.exit(1);
    }
    return queueAccount.pubkey;
}


/**
 * Creates, simulates, sends, and confirms a transaction.
 * @param sbProgram - The Switchboard program.
 * @param connection - The Solana connection object.
 * @param ix - The instruction array for the transaction.
 * @param keypair - The keypair of the payer.
 * @param signers - The array of signers for the transaction.
 * @param txOpts - The transaction options.
 * @returns The transaction signature.
 */
export async function handleTransaction(
    sbProgram: anchor.Program,
    connection: Connection,
    ix: anchor.web3.TransactionInstruction[],
    keypair: Keypair,
    signers: Keypair[],
    txOpts: any
): Promise<string> {
    const createTx = await sb.asV0Tx({
        connection: sbProgram.provider.connection,
        ixs: ix,
        payer: keypair.publicKey,
        signers: signers,
        computeUnitPrice: 75_000,
        computeUnitLimitMultiple: 1.3,
    });

    const sim = await connection.simulateTransaction(createTx, txOpts);
    const sig = await connection.sendTransaction(createTx, txOpts);
    await connection.confirmTransaction(sig, COMMITMENT);
    console.log("  Transaction Signature", sig);
    return sig;
}

export async function initializeGame(
    myProgram: anchor.Program,
    playerStateAccount: PublicKey,
    escrowAccount: PublicKey,
    // keypair: Keypair,
    sbProgram: anchor.Program,
    connection: Connection,
    wallet: anchor.Wallet
): Promise<void> {

    console.log('trying to build initialize tx')

    const initIx = await myProgram.methods
        .initialize()
        .accounts({
            playerState: playerStateAccount,
            escrowAccount: escrowAccount,
            user: wallet.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .instruction();

    // Create a transaction
    // const transaction = new Transaction().add(initIx);

    // // Specify the fee payer (usually the wallet's public key)
    // transaction.feePayer = wallet.publicKey;

    // // Set a recent blockhash
    // transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    // // Sign the transaction
    // const signedTx = await wallet.signTransaction(transaction);

    // console.log('Signed Transaction:', signedTx);

    const txOpts = {
        commitment: "processed" as Commitment,
        skipPreflight: true,
        maxRetries: 0,
    };

    // const signedTx = await wallet.signTransaction(initIx);
    // console.log('signed', signedTx);

    try {
        const transaction = new Transaction().add(initIx);
        // const signed = await wallet.signTransaction(transaction);

        // const sim4 = await connection.simulateTransaction(signed);


        transaction.feePayer = wallet.publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const signedTransaction = await wallet.signTransaction(transaction);

        const txId = await connection.sendRawTransaction(signedTransaction.serialize(), {
            skipPreflight: true,
            preflightCommitment: "finalized"
        });
        
        console.log("Transaction sent:", txId);
        
        // Confirm transaction
        await connection.confirmTransaction(txId, "finalized");
        console.log("Transaction confirmed!");
        

        // const sig4 = await wallet.(transaction, connection);
        // const sig4 = await connection.sendTransaction(transaction, connection);
        // await connection.confirmTransaction(sig4, COMMITMENT);
        // Simulate the signed transaction to check if it's valid
        // const sim = await connection.simulateTransaction(signedTx, txOpts);
        // console.log("Simulation result: ", sim);

        // // Send the signed transaction
        // const sig1 = await connection.sendTransaction(signedTx, txOpts);
        // console.log("Initialize result: ", sig1);

        // const txId = await connection.sendRawTransaction(signedTx.serialize(), txOpts);
        // console.log('Transaction ID:', txId);

        // return txId;
    }
    catch (err) {
        console.error(err)
    }

    // await handleTransaction(
    //     sbProgram,
    //     connection,
    //     [initIx],
    //     keypair,
    //     [keypair],
    //     txOpts
    // );
}

export /**
 * Creates the coin flip instruction for the given program.
 * @param myProgram - The Anchor program.
 * @param rngKpPublicKey - The public key of the randomness keypair.
 * @param userGuess - The user's guess (heads or tails).
 * @param playerStateAccount - The player's state account public key.
 * @param keypair - The keypair of the user.
 * @param escrowAccount - The escrow account public key.
 * @returns The coin flip instruction.
 */
    async function createCoinFlipInstruction(
        myProgram: anchor.Program,
        rngKpPublicKey: PublicKey,
        userGuess: number,
        playerStateAccount: PublicKey,
        // keypair: Keypair,
        escrowAccount: PublicKey,
        wallet: anchor.Wallet,
    ): Promise<anchor.web3.TransactionInstruction> {
    return await myProgram.methods
        .coinFlip(rngKpPublicKey, userGuess)
        .accounts({
            playerState: playerStateAccount,
            user: wallet.publicKey,
            randomnessAccountData: rngKpPublicKey,
            escrowAccount: escrowAccount,
            systemProgram: SystemProgram.programId,
        })
        .instruction();
}

/**
 * Creates the settle flip instruction for the given program.
 * @param myProgram - The Anchor program.
 * @param escrowBump - The bump seed for the escrow account.
 * @param playerStateAccount - The player's state account public key.
 * @param rngKpPublicKey - The public key of the randomness keypair.
 * @param escrowAccount - The escrow account public key.
 * @param keypair - The keypair of the user.
 * @returns The settle flip instruction.
 */
export async function settleFlipInstruction(
    myProgram: anchor.Program,
    escrowBump: number,
    playerStateAccount: PublicKey,
    rngKpPublicKey: PublicKey,
    escrowAccount: PublicKey,
    wallet: anchor.Wallet,
): Promise<anchor.web3.TransactionInstruction> {
    return await myProgram.methods
        .settleFlip(escrowBump)
        .accounts({
            playerState: playerStateAccount,
            randomnessAccountData: rngKpPublicKey,
            escrowAccount: escrowAccount,
            user: wallet.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .instruction();
}

export async function ensureEscrowFunded(
    connection: Connection,
    escrowAccount: PublicKey,
    keypair: Keypair,
    sbProgram: anchor.Program,
    txOpts: any
): Promise<void> {
    const accountBalance = await connection.getBalance(escrowAccount);
    const minRentExemption =
        await connection.getMinimumBalanceForRentExemption(0);

    const requiredBalance = minRentExemption;
    if (accountBalance < requiredBalance) {
        const amountToFund = requiredBalance - accountBalance;
        console.log(
            `Funding account with ${amountToFund} lamports to meet rent exemption threshold.`
        );

        const transferIx = SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: escrowAccount,
            lamports: amountToFund,
        });

        const transferTx = await sb.asV0Tx({
            connection: sbProgram.provider.connection,
            ixs: [transferIx],
            payer: keypair.publicKey,
            signers: [keypair],
            computeUnitPrice: 75_000,
            computeUnitLimitMultiple: 1.3,
        });

        const sim3 = await connection.simulateTransaction(transferTx, txOpts);
        const sig3 = await connection.sendTransaction(transferTx, txOpts);
        await connection.confirmTransaction(sig3, COMMITMENT);
        console.log("  Transaction Signature ", sig3);
    } else {
        console.log("  Escrow account funded already");
    }
}
