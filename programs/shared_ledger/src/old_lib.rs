use anchor_lang::prelude::*;

declare_id!("27b22Rj4yVNXM1vEdh65LJ2HsfbmWwBeoncMEFd14bhL");

#[program]
pub mod shared_ledger {
    use super::*;

    pub fn create_ledger(ctx: Context<CreateLedger>, uuid: Pubkey, topic: String) -> Result<()> {
        let ledger: &mut Account<Ledger> = &mut ctx.accounts.ledger;
        let author: &Signer = &ctx.accounts.author;

        if topic.chars().count() > 50 {
            return Err(ErrorCode::TopicTooLong.into())
        }

        ledger.author = *author.key;
        ledger.uuid = uuid;
        ledger.topic = topic;
        ledger.users_count = 0;
        ledger.bump = *ctx.bumps.get("ledger").unwrap();

        Ok(())
    }

    pub fn create_ledger_user(ctx: Context<CreateLedgerUser>, uuid: Pubkey, user_pubkey: Pubkey, name: String) -> Result<()> {
        let ledger_user: &mut Account<LedgerUser> = &mut ctx.accounts.ledger_user;

        if name.chars().count() > 25 {
            return Err(ErrorCode::NameTooLong.into());
        }

        ledger_user.ledger_key = ctx.accounts.ledger.key();
        ledger_user.user_pubkey = user_pubkey;
        ledger_user.name = name;
        ledger_user.bump = *ctx.bumps.get("ledger_user").unwrap();

        Ok(())
    }

    pub fn create_transaction(ctx: Context<CreateTransaction>, uuid: Pubkey, name: String, amount: f64, payer: Pubkey) -> Result<()> {
        let transaction: &mut Account<Transaction> = &mut ctx.accounts.transaction;
        let author: &Signer = &ctx.accounts.author;

        if name.chars().count() > 50 {
            return Err(ErrorCode::NameTooLong.into());
        }

        transaction.author = *author.key;
        transaction.uuid = uuid;
        transaction.ledger_key = ctx.accounts.ledger.key();
        transaction.payer = payer;
        transaction.amount = amount;
        transaction.name = name;
        transaction.bump = *ctx.bumps.get("transaction").unwrap();

        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided topic should be 50 characters long maximum.")]
    TopicTooLong,
    #[msg("The provided name should be 50 characters long maximum.")]
    NameTooLong,
}

#[derive(Accounts)]
#[instruction(uuid: Pubkey)]
pub struct CreateLedger<'info> {
    #[account(init, 
        payer = author, 
        seeds=[
            b"ledger".as_ref(), 
            uuid.key().as_ref()
        ], 
        bump, 
        space = Ledger::LEN
    )]
    pub ledger: Account<'info, Ledger>,

    #[account(mut)]
    pub author: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(uuid: Pubkey)]
pub struct CreateLedgerUser<'info> {
    #[account(mut, has_one = author)]
    pub ledger: Account<'info, Ledger>,

    #[account(
        init,
        seeds = [
            b"ledger_user".as_ref(),
            ledger.key().as_ref(),
            uuid.as_ref(),
        ],
        bump,
        payer = author,
        space = LedgerUser::LEN
    )]
    pub ledger_user: Account<'info, LedgerUser>,

    #[account(mut)]
    pub author: Signer<'info>,
    
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
#[instruction(uuid: Pubkey)]
pub struct CreateTransaction<'info> {
    #[account(mut, has_one = author)]
    pub ledger: Account<'info, Ledger>,

    #[account(
        init,
        seeds = [
            b"transaction".as_ref(),
            ledger.key().as_ref(),
            uuid.as_ref(),
        ],
        bump,
        payer = author,
        space = Transaction::LEN
    )]
    pub transaction: Account<'info, Transaction>,

    #[account(mut)]
    pub author: Signer<'info>,
    
    pub system_program: Program<'info, System>
}

#[account]
pub struct Ledger {
    pub author: Pubkey,
    pub uuid: Pubkey,
    pub topic: String,
    pub users_count: u8,
    pub bump: u8,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const BUMP_LENGTH: usize = 1;

impl Ledger {
    const MAX_TOPIC_LENGTH: usize = 64; // 50 chars max.
    const USER_COUNT_LENGTH: usize = 1;

    const LEN: usize = DISCRIMINATOR_LENGTH 
        + PUBLIC_KEY_LENGTH //author
        + PUBLIC_KEY_LENGTH //uuid
        + STRING_LENGTH_PREFIX + Ledger::MAX_TOPIC_LENGTH //topic
        + Ledger::USER_COUNT_LENGTH
        + BUMP_LENGTH;
}

#[account]
pub struct LedgerUser {
    pub ledger_key: Pubkey,
    pub user_pubkey: Pubkey,
    pub name: String,
    pub bump: u8,
}

impl LedgerUser {
    const MAX_NAME_LENGTH: usize = 25 * 4; // 25 chars max.

    const LEN: usize = DISCRIMINATOR_LENGTH 
        + PUBLIC_KEY_LENGTH //uuid
        + PUBLIC_KEY_LENGTH //ledger_key
        + PUBLIC_KEY_LENGTH //user_pubkey
        + STRING_LENGTH_PREFIX + Transaction::MAX_NAME_LENGTH //name
        + BUMP_LENGTH;
}

#[account]
pub struct Transaction {
    pub author: Pubkey,
    pub uuid: Pubkey,
    pub ledger_key: Pubkey,
    pub payer: Pubkey,
    pub amount: f64,
    pub name: String,
    pub bump: u8,
}

impl Transaction {
    const MAX_NAME_LENGTH: usize = 50 * 4; // 50 chars max.
    const ANOUNT: usize = 8; // Double float.

    const LEN: usize = DISCRIMINATOR_LENGTH 
        + PUBLIC_KEY_LENGTH //author
        + PUBLIC_KEY_LENGTH //uuid
        + PUBLIC_KEY_LENGTH //ledger_key
        + PUBLIC_KEY_LENGTH //payer
        + Transaction::ANOUNT //amount
        + STRING_LENGTH_PREFIX + Transaction::MAX_NAME_LENGTH //name
        + BUMP_LENGTH;
}