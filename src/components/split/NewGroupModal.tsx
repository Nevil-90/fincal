'use client'

import { useRef, useState } from 'react'
import { Plus, Trash2, Users, X } from 'lucide-react'
import { toast } from 'sonner'

interface Member {
  name: string
  email: string
  phone: string
}

interface Props {
  onClose: () => void
  onCreated: () => void
}

const emptyMember = (): Member => ({ name: '', email: '', phone: '' })

export default function NewGroupModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [members, setMembers] = useState<Member[]>([emptyMember()])
  const [loading, setLoading] = useState(false)
  const nameInputs = useRef<Array<HTMLInputElement | null>>([])
  const emailInputs = useRef<Array<HTMLInputElement | null>>([])
  const enteredMemberCount = members.filter((member) => member.name.trim()).length

  const updateMember = (index: number, field: keyof Member, value: string) => {
    setMembers((current) => current.map((member, itemIndex) => (
      itemIndex === index ? { ...member, [field]: value } : member
    )))
  }

  const addMember = () => {
    const nextIndex = members.length
    setMembers((current) => [...current, emptyMember()])
    requestAnimationFrame(() => nameInputs.current[nextIndex]?.focus())
  }

  const removeMember = (index: number) => {
    setMembers((current) => current.filter((_, itemIndex) => itemIndex !== index))
    requestAnimationFrame(() => nameInputs.current[Math.max(0, index - 1)]?.focus())
  }

  const handleNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    emailInputs.current[index]?.focus()
  }

  const handleEmailKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    if (index < members.length - 1) {
      nameInputs.current[index + 1]?.focus()
      return
    }
    addMember()
  }

  const handleMemberPaste = (event: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    const lines = event.clipboardData.getData('text').split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    if (lines.length < 2) return

    event.preventDefault()
    const pastedMembers = lines.map((line) => {
      const [memberName = '', memberEmail = ''] = line.split(/\t|,/).map((value) => value.trim())
      return { name: memberName, email: memberEmail, phone: '' }
    })

    setMembers((current) => [
      ...current.slice(0, index),
      ...pastedMembers,
      ...current.slice(index + 1).filter((member) => member.name.trim() || member.email.trim()),
    ])
    requestAnimationFrame(() => emailInputs.current[index + pastedMembers.length - 1]?.focus())
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return toast.error('Add a group name')
    const incompleteMember = members.find((member) => !member.name.trim() && member.email.trim())
    if (incompleteMember) return toast.error('Add a name for every email')
    const normalizedNames = members.filter((member) => member.name.trim()).map((member) => member.name.trim().toLowerCase())
    if (new Set(normalizedNames).size !== normalizedNames.length) return toast.error('Each member name must be unique')

    setLoading(true)
    try {
      const response = await fetch('/api/split/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          members: members
            .filter((member) => member.name.trim())
            .map((member) => ({ name: member.name.trim(), email: member.email.trim(), phone: member.phone })),
        }),
      })
      if (!response.ok) throw new Error((await response.json()).error)
      toast.success(`${name.trim()} created`)
      onCreated()
      onClose()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Could not create group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center sm:p-4">
      <button
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm"
        aria-label="Close"
      />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-group-title"
        className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[24px] border border-slate-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:max-h-[84vh] sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
          <div>
            <h2 id="new-group-title" className="text-lg font-black tracking-tight text-slate-950 dark:text-white">New group</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">Create a shared space for upcoming expenses.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close new group" className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-neutral-300 dark:hover:bg-neutral-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3.5 overflow-y-auto px-5 py-4 custom-scrollbar">
          <Field label="Group name">
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Goa weekend"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
          </Field>

          <Field label="Description" optional>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A short note about this group"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            />
          </Field>

          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-700 dark:text-neutral-200">Members</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-neutral-800 dark:text-neutral-400">
                      {enteredMemberCount} added
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400">You are included automatically.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addMember}
                className="flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/30"
              >
                <Plus className="h-3.5 w-3.5" /> Add person
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 dark:border-neutral-700">
              <div className="grid grid-cols-[28px_minmax(82px,0.8fr)_minmax(120px,1.2fr)_36px] items-center gap-2 border-b border-slate-200 bg-slate-50 px-2.5 py-2 dark:border-neutral-700 dark:bg-neutral-800/60">
                <span className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">#</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Name</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">Email optional</span>
                <span className="sr-only">Remove</span>
              </div>

              <div className="max-h-[192px] overflow-y-auto custom-scrollbar">
                {members.map((member, index) => (
                  <div
                    key={index}
                    className="grid min-h-12 grid-cols-[28px_minmax(82px,0.8fr)_minmax(120px,1.2fr)_36px] items-center gap-2 border-b border-slate-100 px-2.5 last:border-0 dark:border-neutral-800"
                  >
                    <span className="text-center text-xs font-bold tabular-nums text-slate-400 dark:text-neutral-500">
                      {index + 1}
                    </span>
                    <input
                      ref={(element) => { nameInputs.current[index] = element }}
                      value={member.name}
                      onChange={(event) => updateMember(index, 'name', event.target.value)}
                      onKeyDown={(event) => handleNameKeyDown(event, index)}
                      onPaste={(event) => handleMemberPaste(event, index)}
                      aria-label={`Member ${index + 1} name`}
                      placeholder="Name"
                      className="h-10 min-w-0 rounded-lg bg-transparent px-2 text-sm font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:bg-blue-50/70 focus:ring-2 focus:ring-inset focus:ring-blue-500/30 dark:text-white dark:focus:bg-blue-950/20"
                    />
                    <input
                      ref={(element) => { emailInputs.current[index] = element }}
                      type="email"
                      value={member.email}
                      onChange={(event) => updateMember(index, 'email', event.target.value)}
                      onKeyDown={(event) => handleEmailKeyDown(event, index)}
                      aria-label={`Member ${index + 1} email, optional`}
                      placeholder="name@email.com"
                      className="h-10 min-w-0 rounded-lg bg-transparent px-2 text-sm text-slate-600 outline-none placeholder:text-slate-400 focus:bg-blue-50/70 focus:ring-2 focus:ring-inset focus:ring-blue-500/30 dark:text-neutral-300 dark:focus:bg-blue-950/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      disabled={members.length === 1}
                      aria-label={`Remove member ${index + 1}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:invisible dark:hover:bg-rose-950/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-2 text-[11px] text-slate-500 dark:text-neutral-400">
              Press Enter to move across rows. Paste multiple lines as <span className="font-semibold">name, email</span>.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 p-4 dark:border-neutral-800 sm:px-5">
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-40 dark:focus-visible:ring-offset-neutral-900"
          >
            {loading
              ? 'Creating group...'
              : `Create group${enteredMemberCount ? ` with ${enteredMemberCount + 1} members` : ''}`}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  optional = false,
  children,
}: {
  label: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-neutral-300">
        {label}
        {optional && <span className="font-normal text-slate-400">optional</span>}
      </span>
      {children}
    </label>
  )
}
