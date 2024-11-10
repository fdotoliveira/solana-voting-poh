const { Keypair, Connection, SystemProgram, Transaction, PublicKey } = require('@solana/web3.js');
const fs = require('fs');

// A conta que irá pagar a criação das contas (deve ter lamports suficientes)
const senderKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('/home/felipe/voter-keypair.json', 'utf-8'))));

// Configura a conexão com a rede local
const connection = new Connection("http://127.0.0.1:8899", "confirmed");

// Gerar chaves para os candidatos
const generateKeypair = () => {
    const keypair = Keypair.generate();
    return keypair;
};

const candidate1 = generateKeypair();
const candidate2 = generateKeypair();
const candidate3 = generateKeypair();

console.log('Candidato 1 Chave Pública:', candidate1.publicKey.toString());
console.log('Candidato 2 Chave Pública:', candidate2.publicKey.toString());
console.log('Candidato 3 Chave Pública:', candidate3.publicKey.toString());

// Função para criar conta no Solana
async function createAccount(keypair) {
    try {
        // Verifica o saldo da conta do remetente (quem pagará a criação)
        const senderBalance = await connection.getBalance(senderKeypair.publicKey);
        // console.log('Saldo do remetente:', senderBalance);

        // Obtem o valor mínimo de lamports necessário para a criação da conta
        const lamports = await connection.getMinimumBalanceForRentExemption(8); // Espaço reservado para a conta

        // console.log('Lamports necessários para criar uma conta:', lamports);

        // Verifica se o saldo do remetente é suficiente para cobrir o custo
        if (senderBalance < lamports) {
            console.log('Saldo do remetente insuficiente para pagar pela criação das contas!');
            return;
        }

        // Obtem o recentBlockhash
        const { blockhash } = await connection.getRecentBlockhash();

        // Cria a transação para criar a conta
        const transaction = new Transaction({
            recentBlockhash: blockhash, // Adiciona o recentBlockhash à transação
            feePayer: senderKeypair.publicKey, // A conta que pagará pela transação
        }).add(
            SystemProgram.createAccount({
                fromPubkey: senderKeypair.publicKey, // Conta do remetente (quem paga pela criação)
                newAccountPubkey: keypair.publicKey, // Chave pública do candidato (nova conta)
                lamports: lamports,
                space: 8,  // O espaço reservado para os dados do candidato
                programId: new PublicKey("3RoXpuyxHwPBgp4jppN1TGtUjmDo66aUHjCtEdKZuEkQ"),  // O ID do seu programa
            })
        );

        // Assina a transação com as chaves privadas do remetente e do candidato
        transaction.sign(senderKeypair, keypair);

        // Envia e confirma a transação
        const signature = await connection.sendTransaction(transaction, [senderKeypair, keypair]); // Assine e envie a transação
        await connection.confirmTransaction(signature);

        console.log(`Conta do candidato criada com sucesso: ${keypair.publicKey.toString()}`);

        // Obter e exibir informações da conta recém-criada para debugging
        const accountInfo = await connection.getAccountInfo(keypair.publicKey);
        // console.log('Informações da conta do candidato:', accountInfo);
    } catch (error) {
        console.log("Erro ao criar a conta:", error);
        if (error.logs) {
            console.log("Logs da transação:", error.logs);
        }
    }
}

// Cria contas para os 3 candidatos
(async () => {
    await createAccount(candidate1);
    await createAccount(candidate2);
    await createAccount(candidate3);
})();
