"use client"


import Image from 'next/image'
import React from 'react'
import { useProject } from '~/hooks/use-project'
import { api } from '~/trpc/react'

const TeamMembers = () => {
    const { projectId } = useProject()
    const { data : teamMembers } = api.project.getTeamMembers.useQuery({projectId})
    
  return (
    <div className='flex items-center gap-2'>
        {
            teamMembers?.map((member) =>(
                <img className='rounded-full' key={member.User.id} src={member.User.imageUrl || ""} alt={member.User.firstName || ""} width={30} height={30} />
            ))
        }
    </div>
  )
}

export default TeamMembers