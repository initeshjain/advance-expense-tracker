'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { UserPlus, Edit, Trash2, Mail, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'

const contactSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    nickname: z.string().optional(),
})

interface Contact {
    id: string
    nickname?: string
    user: {
        id: string
        name: string
        email: string
        image?: string
    }
}

export function ContactsList() {
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddingContact, setIsAddingContact] = useState(false)
    const [editingContact, setEditingContact] = useState<Contact | null>(null)

    const form = useForm<z.infer<typeof contactSchema>>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            email: '',
            nickname: '',
        },
    })

    const editForm = useForm<z.infer<typeof contactSchema>>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            email: '',
            nickname: '',
        },
    })

    useEffect(() => {
        fetchContacts()
    }, [])

    const fetchContacts = async () => {
        try {
            const response = await fetch('/api/contacts')
            if (response.ok) {
                const data = await response.json()
                setContacts(data)
            }
        } catch (error) {
            console.error('Error fetching contacts:', error)
            toast.error('Failed to fetch contacts')
        } finally {
            setLoading(false)
        }
    }

    const onSubmit = async (values: z.infer<typeof contactSchema>) => {
        try {
            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            })

            if (response.ok) {
                fetchContacts()
                form.reset()
                setIsAddingContact(false)
                toast.success('Contact added successfully!')
            } else {
                throw new Error('Failed to add contact')
            }
        } catch (error) {
            console.error('Error adding contact:', error)
            toast.error('Failed to add contact')
        }
    }

    const handleEdit = (contact: Contact) => {
        setEditingContact(contact)
        editForm.reset({
            email: contact.user.email,
            nickname: contact.nickname || '',
        })
    }

    const onEditSubmit = async (values: z.infer<typeof contactSchema>) => {
        if (!editingContact) return

        try {
            const response = await fetch(`/api/contacts/${editingContact.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nickname: values.nickname }),
            })

            if (response.ok) {
                fetchContacts()
                setEditingContact(null)
                toast.success('Contact updated successfully!')
            } else {
                throw new Error('Failed to update contact')
            }
        } catch (error) {
            console.error('Error updating contact:', error)
            toast.error('Failed to update contact')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this contact?')) return

        try {
            const response = await fetch(`/api/contacts/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                fetchContacts()
                toast.success('Contact deleted successfully!')
            } else {
                throw new Error('Failed to delete contact')
            }
        } catch (error) {
            console.error('Error deleting contact:', error)
            toast.error('Failed to delete contact')
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">My Contacts</h3>
                <Dialog open={isAddingContact} onOpenChange={setIsAddingContact}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Contact
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Contact</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter email address" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="nickname"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nickname (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter nickname" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full">
                                    Add Contact
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {contacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No contacts found</p>
                    <p className="text-sm">Add people you frequently split expenses with!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {contacts.map((contact) => (
                        <Card key={contact.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Avatar>
                                            <AvatarImage src={contact.user.image} />
                                            <AvatarFallback>
                                                {contact.user.name?.charAt(0) || <User className="h-4 w-4" />}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">
                                                {contact.nickname || contact.user.name}
                                            </p>
                                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                                <Mail className="w-3 h-3" />
                                                <span>{contact.user.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(contact)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(contact.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Contact</DialogTitle>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input {...field} disabled />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="nickname"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nickname (Optional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter nickname" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full">
                                Update Contact
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}