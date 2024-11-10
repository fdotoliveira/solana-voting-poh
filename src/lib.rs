use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    msg,
    program_error::ProgramError,
};
use borsh::{BorshDeserialize, BorshSerialize};

#[derive(Debug, BorshDeserialize, BorshSerialize, Clone)]
pub struct Candidate {
    pub votes: u64,
}

entrypoint!(process_instruction);

pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let _voter_account = next_account_info(accounts_iter)?; // Conta do eleitor
    let candidate_account = next_account_info(accounts_iter)?; // Conta do candidato

    let candidate_id = instruction_data[0]; // ID do candidato

    // Log para depuração
    msg!("Recebido ID do candidato: {}", candidate_id);

    // Checa se o candidato é válido
    if candidate_id > 3 {
        msg!("Candidato inválido: {}", candidate_id);
        return Err(ProgramError::InvalidInstructionData);
    }

    // Verifica se a conta do candidato é válida e tem permissão para escrita
    if !candidate_account.is_writable {
        msg!("A conta do candidato não é escrita!");
        return Err(ProgramError::InvalidAccountData);
    }

    // Log para depuração
    msg!("Verificando dados da conta do candidato: {}", candidate_account.key);

    // Recupera dados da conta do candidato
    let mut candidate_data = candidate_account.try_borrow_mut_data()?;

    // Deserializar ou inicializar os dados da conta do candidato
    let mut candidate = match Candidate::try_from_slice(&candidate_data) {
        Ok(c) => {
            // Log para depuração
            msg!("Dados existentes para o candidato: {:?}", c);
            c // Se já existir, deserializa
        }
        Err(_) => {
            // Caso contrário, inicializa com 0 votos
            msg!("Dados do candidato não encontrados. Inicializando com 0 votos.");
            Candidate { votes: 0 }
        }
    };

    // Log para depuração
    msg!("Votos atuais do candidato: {}", candidate.votes);

    // Incrementa o número de votos
    candidate.votes += 1;

    // Log para depuração
    msg!("Votos após incremento: {}", candidate.votes);

    // Serializa os dados atualizados de volta para a conta
    let serialized_candidate = candidate.try_to_vec()?;
    candidate_data.copy_from_slice(&serialized_candidate);

    msg!("Voto registrado com sucesso para o candidato: {}", candidate_id);

    Ok(())
}
