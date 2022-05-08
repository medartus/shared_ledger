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