const fs = require("fs");
const {
    Connection,
    PublicKey,
    Keypair
} = require('@solana/web3.js');

// Carrega a chave secreta do arquivo (chave do eleitor, se necessário para a consulta)
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync('/home/felipe/voter-keypair.json', 'utf-8')));

// ID do programa (verifique se está correto)
const programId = new PublicKey("3RoXpuyxHwPBgp4jppN1TGtUjmDo66aUHjCtEdKZuEkQ");

// Conexão com o cluster Solana
const connection = new Connection("http://127.0.0.1:8899", "confirmed");

// Chaves públicas dos candidatos
const candidateKeys = [
    new PublicKey("J8DJLq7kr422WjnbxBeY2ok5ehXZcXtJvYqm2VEBDo1x"),  // Candidato 1
    new PublicKey("DrfWc8YGN9epdUfTpxJCQfQVXwNuJn9ARzeimAsj1WrF"),  // Candidato 2
    new PublicKey("CaDvAGwFzrNNB66JrDohLVhKiH6Xh1deBLDx4qzJEusn")   // Candidato 3
];

// Função para obter os votos de um candidato
async function getVotesForCandidate(candidatePublicKey) {
    try {
        // Obtem a conta do candidato e ler seus dados
        const accountInfo = await connection.getAccountInfo(candidatePublicKey);

        if (accountInfo === null) {
            console.log("Conta do candidato não encontrada.");
            return;
        }

        // Ler os dados da conta (onde o número de votos está armazenado no primeiro byte)
        const candidateData = accountInfo.data;

        // Assumindo que o número de votos é armazenado no primeiro byte
        const votes = candidateData[0];

        console.log(`Número de votos para o candidato ${candidatePublicKey.toBase58()}: ${votes}`);
    } catch (error) {
        console.log("Erro ao buscar os votos:", error);
    }
}

(async () => {
    for (let i = 0; i < candidateKeys.length; i++) {
        await getVotesForCandidate(candidateKeys[i]);
    }
})();
