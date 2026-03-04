<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { authClient } from '~/lib/auth-client'

const toast = useToast()
const router = useRouter()

const fields: AuthFormField[] = [
    {
        name: 'name',
        type: 'text',
        label: 'Name',
        placeholder: 'Enter your name',
        required: true
    }, {
        name: 'email',
        type: 'email',
        label: 'Email',
        placeholder: 'Enter your email',
        required: true
    }, {
        name: 'password',
        label: 'Password',
        type: 'password',
        placeholder: 'Enter your password',
        required: true
    }]

const providers = [{
    label: 'Google',
    icon: 'i-simple-icons-google',
    onClick: () => {
        authClient.signIn.social({
            provider: 'google',
            callbackURL: '/',
        })
    }
}, {
    label: 'GitHub',
    icon: 'i-simple-icons-github',
    onClick: () => {
        authClient.signIn.social({
            provider: 'github',
            callbackURL: '/',
        })
    }
}]

const schema = z.object({
    name: z.string('Name is required'),
    email: z.email('Invalid email'),
    password: z.string('Password is required').min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
    const { data, error } = await authClient.signUp.email({
        name: payload.data.name,
        email: payload.data.email,
        password: payload.data.password,
        callbackURL: '/',
    })

    if (error) {
        toast.add({ title: 'Registration failed', description: error.message, color: 'error' })
    } else {
        toast.add({ title: 'Registration successful', description: 'Welcome!', color: 'success' })
        router.push('/')
    }
}
</script>

<template>
    <div class="flex flex-col items-center justify-center gap-4 p-4">
        <UPageCard class="w-full max-w-md">
            <UAuthForm :schema="schema" title="Register" description="Create a new account to get started."
                icon="i-lucide-user" :fields="fields" :providers="providers" @submit="onSubmit">
                <template #footer>
                    Already have an account? <NuxtLink to="/login" class="text-primary font-medium">Login</NuxtLink>
                </template>
            </UAuthForm>
        </UPageCard>
    </div>
</template>
