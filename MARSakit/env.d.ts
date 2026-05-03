/// <reference types="vite/client" />

// Type declarations for Vue SFCs
declare module '*.vue' {
	import { DefineComponent } from 'vue'
	const component: DefineComponent<{}, {}, any>
	export default component
}
