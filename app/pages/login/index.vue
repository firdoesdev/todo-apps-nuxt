<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent, AuthFormField } from "@nuxt/ui";
import { authClient } from "~/lib/auth-client";

const toast = useToast();
const route = useRoute();
const router = useRouter();

const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "Enter your email",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    required: true,
  },
  {
    name: "remember",
    label: "Remember me",
    type: "checkbox",
  },
];

const providers = [
  {
    label: "Google",
    icon: "i-simple-icons-google",
    onClick: () => {
      authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    },
  },
  {
    label: "GitHub",
    icon: "i-simple-icons-github",
    onClick: () => {
      authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
      });
    },
  },
];

const schema = z.object({
  email: z.email("Invalid email"),
  password: z
    .string("Password is required")
    .min(8, "Must be at least 8 characters"),
});

type Schema = z.output<typeof schema>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { data, error } = await authClient.signIn.email({
    email: payload.data.email,
    password: payload.data.password,
  });

  if (error) {
    toast.add({
      title: "Login failed",
      description: error.message,
      color: "error",
    });
  } else {
    toast.add({
      title: "Login successful",
      description: "Welcome back!",
      color: "success",
    });
    const redirect = route.query.redirect as string;
    router.push(redirect || "/");
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Login"
        description="Enter your credentials to access your account."
        icon="i-lucide-user"
        :fields="fields"
        :providers="providers"
        @submit="onSubmit"
      >
        <template #footer>
          Don't have an account?
          <NuxtLink to="/register" class="text-primary font-medium"
            >Register</NuxtLink
          >
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
