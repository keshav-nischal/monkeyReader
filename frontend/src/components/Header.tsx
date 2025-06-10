import React from 'react'
import { Logo } from '@/components/Logo'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem, Separator } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const Header = () => {
  return (
    <div className='flex justify-between w-full'>
        <Logo></Logo>
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Button variant="outline">Profile</Button>        
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem>Team</DropdownMenuItem>
                <DropdownMenuItem>Subscription</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  )
}

export default Header