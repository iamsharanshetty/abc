"use client"

import * as React from "react"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card"
import { Modal } from "@/components/ui/Modal"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/Accordion"

export default function DesignSystemPage() {
    const [isModalOpen, setIsModalOpen] = React.useState(false)

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex">
                <aside className="hidden w-64 border-r bg-muted/40 md:block">
                    <Sidebar />
                </aside>
                <main className="flex-1 p-8">
                    <div className="space-y-8">
                        <section>
                            <h2 className="mb-4 text-2xl font-bold">Buttons</h2>
                            <div className="flex flex-wrap gap-4">
                                <Button>Default</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="destructive">Destructive</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="link">Link</Button>
                                <Button isLoading>Loading</Button>
                            </div>
                        </section>

                        <section>
                            <h2 className="mb-4 text-2xl font-bold">Inputs</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Input placeholder="Default Input" />
                                <Input label="With Label" placeholder="Enter text" />
                                <Input
                                    label="With Error"
                                    placeholder="Enter text"
                                    error="This field is required"
                                />
                                <Input
                                    label="With Helper Text"
                                    placeholder="Enter text"
                                    helperText="This is some helper text"
                                />
                            </div>
                        </section>

                        <section>
                            <h2 className="mb-4 text-2xl font-bold">Cards</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Card Title</CardTitle>
                                        <CardDescription>Card Description</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p>Card Content</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button>Action</Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </section>

                        <section>
                            <h2 className="mb-4 text-2xl font-bold">Modal</h2>
                            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
                            <Modal
                                isOpen={isModalOpen}
                                onClose={() => setIsModalOpen(false)}
                                title="Example Modal"
                                footer={
                                    <>
                                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button onClick={() => setIsModalOpen(false)}>Continue</Button>
                                    </>
                                }
                            >
                                <p>This is the modal content.</p>
                            </Modal>
                        </section>

                        <section>
                            <h2 className="mb-4 text-2xl font-bold">Accordion</h2>
                            <Accordion className="w-full max-w-md">
                                <AccordionItem>
                                    <AccordionTrigger>Is it accessible?</AccordionTrigger>
                                    <AccordionContent>
                                        Yes. It adheres to the WAI-ARIA design pattern.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem>
                                    <AccordionTrigger>Is it styled?</AccordionTrigger>
                                    <AccordionContent>
                                        Yes. It comes with default styles that matches the other
                                        components' aesthetic.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    )
}
