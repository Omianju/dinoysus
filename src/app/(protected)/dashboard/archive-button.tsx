"use client"

import React from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { useProject } from '~/hooks/use-project'
import { useRefetch } from '~/hooks/use-refetch'
import { api } from '~/trpc/react'




const ArchiveButton = () => {
    const { projectId } = useProject()
    const { mutate : archiveProject, isPending } = api.project.archiveProject.useMutation()
    const refetch = useRefetch()
  return (
    <Button  disabled={isPending} variant={"destructive"} size={"sm"} onClick={() => {
        const confirm = window.confirm("Are you sure you want archive this project?")
        if (confirm) {
            archiveProject({projectId}, {
                onSuccess : () => {
                    toast.success("Project successfully archived")
                    refetch()
                },
                onError : () => {
                    toast.error("Failed to archive the project!")
                }
            })
        }
    }}>
        ArchiveButton
    </Button>
  )
}

export default ArchiveButton