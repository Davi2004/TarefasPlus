import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link' 
import styles from './styles.module.css'
import Image from 'next/image'

export function Header() {
    const { data: session, status } = useSession()
        
    return (
        <header className={styles.header}>
            <section className={styles.content}>
                <nav className={styles.nav}>
                    <Link href="/">
                        <h1 className={styles.logo}>
                            Tarefas<span>+</span>
                        </h1>
                    </Link>

                    {status === "authenticated" && (
                        <Link href="/dashboard" className={styles.link}>
                            Meu Painel
                        </Link>
                    )}
                </nav>

                { status === "loading" ? null : status === "authenticated" ? (
                    <button 
                        className={`${styles.loginButton} ${styles.userArea}`}
                        onClick={ () => signOut()}
                    >
                        {session?.user?.image && (
                            <Image
                                src={session?.user?.image}
                                alt='Foto de perfil'
                                width={30}
                                height={30}
                                className={styles.avatar}
                            />
                        )} Olá, {session?.user?.name}
                    </button>
                ) : (
                    <button className={styles.loginButton} onClick={ () => signIn("google") }>
                        Acessar
                    </button>
                )}
                
            </section>
        </header>
    );
}