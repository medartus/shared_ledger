#![feature(derive_default_enum)]

use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::{invoke};
use anchor_lang::solana_program::system_instruction::{transfer};

declare_id!("27b22Rj4yVNXM1vEdh65LJ2HsfbmWwBeoncMEFd14bhL");

#[program]
pub mod shared_ledger {
    use super::*;
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

    pub fn create_transfer_request(ctx: Context<CreateTransferRequest>, uuid: Pubkey, topic: String, amount: u64) -> Result<()> {
        let transfer: &mut Account<Transfer> = &mut ctx.accounts.transfer;
        let payer: &AccountInfo = &ctx.accounts.payer;
        let requester: &Signer = &ctx.accounts.requester;
        
        let transaction_event = TransactionEvent {
            timestamp: 1,
            event_type: TransactionEventType::CREATION,
        };

        if topic.chars().count() > 50 {
            return Err(ErrorCode::TopicTooLong.into())
        }

        transfer.from = *payer.key;
        transfer.to = *requester.key;
        transfer.uuid = uuid;
        transfer.amount = amount;
        transfer.events[0] = transaction_event;
        transfer.topic = topic;
        transfer.bump = *ctx.bumps.get("transfer").unwrap();

        Ok(())
    }
    
    pub fn execute_transfer_request(ctx: Context<ExecuteTransferRequest>, _uuid: Pubkey) -> Result<()> {
        let transfer_request: &Account<Transfer> = &ctx.accounts.transfer;

        let sol_transfer = transfer(
            &transfer_request.from,
            &transfer_request.to,
            transfer_request.amount,
        );
        invoke(
            &sol_transfer,
            &[
                ctx.accounts.payer.clone(),
                ctx.accounts.requester.clone(),
                ctx.accounts.system_program.clone(),
            ],
        )?;

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
#[instruction(uuid: Pubkey)]
pub struct ExecuteTransferRequest <'info> {
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    pub requester: AccountInfo<'info>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, signer)]
    pub payer: AccountInfo<'info>,

    #[account(
        mut,
        constraint = transfer.from == *payer.key,
        constraint = transfer.to == *requester.key,
        close = requester, 
        seeds = [
            b"transfer".as_ref(), 
            uuid.as_ref()
        ], 
        bump,
    )]
    pub transfer: Account<'info, Transfer>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(uuid: Pubkey)]
pub struct CreateTransferRequest <'info> {
    #[account(
        init, 
        seeds = [
            b"transfer".as_ref(), 
            uuid.as_ref()
        ], 
        bump, 
        payer = requester, 
        space = Transfer::LEN
    )]
    pub transfer: Account<'info, Transfer>,

    #[account(mut)]
    pub requester: Signer<'info>,
    
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub payer: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
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

#[derive(AnchorSerialize, AnchorDeserialize, Default, Clone, Copy, PartialEq, Eq)]
pub enum TransactionEventType  {
    #[default]
    UNDEFINED,
    CREATION,
    CANCEL,
    TRANSFER,
}


#[derive(AnchorSerialize, AnchorDeserialize, Default, Clone, Copy)]
pub struct TransactionEvent {
    pub timestamp: u32,
    pub event_type: TransactionEventType,
}

#[account]
pub struct Transfer {
    pub from: Pubkey,
    pub to: Pubkey,
    pub uuid: Pubkey,
    pub amount: u64,
    pub events: [TransactionEvent;2],
    pub topic: String,
    pub bump: u8,
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
const U32: usize = 4;
const U64: usize = 8;
const BUMP_LENGTH: usize = 1;

impl TransactionEvent {
    const EVENT_TYPE_LENGTH: usize = 1;

    const LEN: usize =  U32 // timestamp
    + TransactionEvent::EVENT_TYPE_LENGTH; // event_type
}

impl Transfer {
    const NUM_TRANSACTION_EVENT: usize = 2;

    const MAX_TOPIC_LENGTH: usize = 50; // 50 chars max.

    const LEN: usize = DISCRIMINATOR_LENGTH 
        + PUBLIC_KEY_LENGTH // from
        + PUBLIC_KEY_LENGTH // to
        + PUBLIC_KEY_LENGTH // uuid
        + U64 // amount
        + STRING_LENGTH_PREFIX + Transfer::MAX_TOPIC_LENGTH //topic
        + Transfer::NUM_TRANSACTION_EVENT * TransactionEvent::LEN
        + BUMP_LENGTH; // bump
}

impl ContentCredential {
    const MAX_HASH_LENGTH: usize = 64 ;
    const CONTENT_LENGTH: usize = 1;

    const LEN: usize = DISCRIMINATOR_LENGTH 
        + PUBLIC_KEY_LENGTH // owner
        + ContentCredential::CONTENT_LENGTH // content
        + STRING_LENGTH_PREFIX + ContentCredential::MAX_HASH_LENGTH; // hash
}