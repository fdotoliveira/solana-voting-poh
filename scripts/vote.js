const fs = require("fs");
const {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    TransactionInstruction
} = require('@solana/web3.js');

// Carrega a chave secreta do arquivo (chave do eleitor)
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync('/home/felipe/voter-keypair.json', 'utf-8')));

// ID do programa (verifique se está correto)
const programId = new PublicKey("3RoXpuyxHwPBgp4jppN1TGtUjmDo66aUHjCtEdKZuEkQ");

// ID do candidato (1, 2 ou 3)
const candidateId = 3;  // Este será o byte que será enviado no `instruction_data`

// Conexão com o cluster Solana
const connection = new Connection("http://127.0.0.1:8899", "confirmed");

// Cria o keypair do eleitor
const voterKeypair = Keypair.fromSecretKey(secretKey);

// Chaves públicas dos candidatos
const candidateKeys = [
    new PublicKey("J8DJLq7kr422WjnbxBeY2ok5ehXZcXtJvYqm2VEBDo1x"),  // Candidato 1
    new PublicKey("DrfWc8YGN9epdUfTpxJCQfQVXwNuJn9ARzeimAsj1WrF"),  // Candidato 2
    new PublicKey("CaDvAGwFzrNNB66JrDohLVhKiH6Xh1deBLDx4qzJEusn")   // Candidato 3
];

// Seleciona a conta do candidato baseado no `candidateId`
const candidatePublicKey = candidateKeys[candidateId - 1];

// Conta do candidato
const candidateAccount = { pubkey: candidatePublicKey, isSigner: false, isWritable: true };

// Prepare a instrução para enviar ao programa
const voteInstruction = new TransactionInstruction({
    programId: programId,
    keys: [
        { pubkey: voterKeypair.publicKey, isSigner: true, isWritable: true },
        candidateAccount,
    ],
    data: Buffer.from([candidateId])
});

const transaction = new Transaction().add(voteInstruction);

// Define o pagador da taxa de transação
transaction.feePayer = voterKeypair.publicKey;

// Função para verificar saldo da conta do eleitor
async function checkBalance() {
    const balance = await connection.getBalance(voterKeypair.publicKey);
    console.log("Saldo da conta do eleitor:", balance / 1000000000, "SOL");
    return balance;
}

(async () => {
    try {
        console.log(`Registrando voto para o candidato: ${candidateId}`);

        // Verifica saldo do eleitor
        const balance = await checkBalance();
        if (balance < 0.001) {
            console.log("Saldo insuficiente para realizar a transação.");
            return;
        }

        // Simula a transação
        const simulationResult = await connection.simulateTransaction(transaction);
        if (simulationResult.value.err) {
            console.error("Erro na simulação da transação:");
            console.log(simulationResult.value.logs);  // Logs da simulação do contrato inteligente
            return;
        }

        console.log("Simulação da transação bem-sucedida.");
        console.log("Logs da simulação:", simulationResult.value.logs); // Verifique os logs da simulação

        // Envia a transação
        const signature = await connection.sendTransaction(transaction, [voterKeypair], {
            skipPreflight: false,
            preflightCommitment: "confirmed",
        });

        // Confirmação da transação
        await connection.confirmTransaction(signature);

        // Recupera os logs da transação confirmada
        const transactionInfo = await connection.getTransaction(signature);
        if (transactionInfo?.meta?.logMessages) {
            console.log("Logs da transação confirmada:", transactionInfo.meta.logMessages);
        } else {
            console.log("Sem logs disponíveis.");
        }

        console.log("Voto registrado com sucesso, assinatura:", signature);
    } catch (error) {
        console.log("Erro:", error);
        if (error.logs) {
            console.log("Logs da transação:", error.logs);
        }
    }
})();
