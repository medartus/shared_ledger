use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::{invoke};
use anchor_lang::solana_program::system_instruction::{transfer};

declare_id!("27b22Rj4yVNXM1vEdh65LJ2HsfbmWwBeoncMEFd14bhL");

#[program]
pub mod shared_ledger {
    use super::*;

    pub fn transfer_native_sol(ctx: Context<Transfer>) -> Result<()> {
        let amount_of_lamports = 42; // could be an argument ;-)

        let sol_transfer = transfer(
            &ctx.accounts.from.key,
            &ctx.accounts.to.key,
            amount_of_lamports,
        );
        invoke(
            &sol_transfer,
            &[
                ctx.accounts.from.clone(),
                ctx.accounts.to.clone(),
                ctx.accounts.system_program.clone(),
            ],
        )?;

        Ok(())
    }

    pub fn create_notification_credential(ctx: Context<CreateContentCredential>, content: ContentType, hash: String ) -> Result<()> {
        let credential: &mut Account<ContentCredential> = &mut ctx.accounts.credential;
        let author: &Signer = &ctx.accounts.author;

        if hash.chars().count() > 64 {
            return Err(ErrorCode::HashTooLong.into())
        }

        credential.owner = *author.key;
        credential.content = content;
        credential.hash = hash;

        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided topic should be 50 characters long maximum.")]
    TopicTooLong,
    #[msg("The provided Hash should be 64 characters long maximum.")]
    HashTooLong,
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut, signer)]
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub from: AccountInfo<'info>,       
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub to: AccountInfo<'info>,        
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CreateContentCredential<'info> {
    #[account(mut)]
    pub author: Signer<'info>,

    #[account(
        init,
        payer = author,
        space = ContentCredential::LEN
    )]
    pub credential: Account<'info, ContentCredential>,
    
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: AccountInfo<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ContentType {
    EMAIL,
}


#[account]
pub struct ContentCredential {
    pub owner: Pubkey,
    pub content: ContentType,
    pub hash: String,
}

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH: usize = 32;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const BUMP_LENGTH: usize = 1;


impl ContentCredential {
    const MAX_HASH_LENGTH: usize = 150 ; // 50 chars max.
    const CONTENT_LENGTH: usize = 1;
    

    const LEN: usize = DISCRIMINATOR_LENGTH 
        + PUBLIC_KEY_LENGTH //owner
        + ContentCredential::CONTENT_LENGTH //content
        + STRING_LENGTH_PREFIX + ContentCredential::MAX_HASH_LENGTH * 4; //hash
}