import { GetServerSideProps } from 'next';
import { ChangeEvent, FormEvent, useState, useEffect } from 'react' 
import styles from './styles.module.css'
import Head from 'next/head';
import { db } from '../../services/firebaseConnection'
import { addDoc, collection, query, orderBy, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore'

import { getSession } from 'next-auth/react'

import { TfiEmail } from "react-icons/tfi";
import { FiX, FiShare2, FiLink } from 'react-icons/fi'
import { FaTrash, FaShare, FaWhatsapp } from 'react-icons/fa'

import { Textarea } from '../../components/textArea'
import Link from 'next/link'

import toast from 'react-hot-toast'

interface HomeProps {
    user: {
        email: string;
    }
}

interface TaskProps {
    id: string;
    created: Date;
    public: boolean;
    tarefa: string;
    user: string;
}

export default function Dashboard({ user }: HomeProps) {
    const [input, setInput] = useState("")
    const [publicTask, setPublicTask] = useState(false)
    const [tasks, setTasks] = useState<TaskProps[]>([])
    
    const [shareTask, setShareTask] = useState<TaskProps | null>(null)
    const [isClosing, setIsClosing] = useState(false)
    
    useEffect(() => {
        async function loadTask() {

            const tarefasRef = collection(db, "tarefas")

            const q = query(
                tarefasRef,
                orderBy("created", "desc"),
                where("user", "==", user?.email)
            )

            onSnapshot(q, (snapshot) => {
                let lista = [] as TaskProps[];

                snapshot.forEach((doc) => {
                    lista.push({
                        id: doc.id,
                        tarefa: doc.data().tarefa,
                        created: doc.data().created,
                        user: doc.data().user,
                        public: doc.data().public,
                    })
                })

                setTasks(lista);
            })
            
        }

        loadTask()
    }, [user?.email])

    useEffect(() => {
        function handleEsc(event: KeyboardEvent) {
            if (event.key === "Escape") {
                closeModal()
            }
        }

        if (shareTask) {
            window.addEventListener("keydown", handleEsc)
        }

        return () => {
            window.removeEventListener("keydown", handleEsc)
        }
    }, [shareTask])
    
    function handleChangePublic(event: ChangeEvent<HTMLInputElement>) {
        setPublicTask(event.target.checked)
    }

    async function handleRegisterTask(event: FormEvent) {
        event.preventDefault()

        if(input === "") {
            toast("ALERTA! O campo precisa ser preenchido", {
                icon: "⚠️"
            })
            return;
        }

        try {
            await addDoc(collection(db, "tarefas"), {
                tarefa: input,
                created: new Date(),
                user: user?.email,
                public: publicTask
            });

            toast.success("Tarefa adicionada com sucesso!")
            setInput("");
            setPublicTask(false);

        } catch(err) {
            console.log(err)
        }
        
    }

    async function handleDeleteTask(id: string) {
        const docRef = doc(db, "tarefas", id)
        await deleteDoc(docRef)
        toast.success("Tarefa excluída com sucesso!")
    }
    
    function getTaskUrl(task: TaskProps) {
        return `${process.env.NEXT_PUBLIC_URL}/task/${task.id}`
    }

    async function shareNative(task: TaskProps) {
        const url = getTaskUrl(task)
        if (navigator.share) {
            await navigator.share({
                title: 'Tarefa compartilhada',
                text: task.tarefa,
                url,
            })
        }
    }

    function shareWhatsApp(task: TaskProps) {
        const text = encodeURIComponent(
            `Olha essa tarefa: ${task.tarefa}\n${getTaskUrl(task)}`
        )
        window.open(`https://wa.me/?text=${text}`, '_blank')
    }

    async function copyLink(task: TaskProps) {
        await navigator.clipboard.writeText(getTaskUrl(task))
        toast.success('Link copiado!')
    }

    function shareEmail(task: TaskProps) {
        window.location.href = `mailto:?subject=Tarefa compartilhada&body=${encodeURIComponent(
            task.tarefa + '\n' + getTaskUrl(task)
        )}`
    }

    function closeModal() {
        setIsClosing(true)

        setTimeout(() => {
            setShareTask(null)
            setIsClosing(false)
        }, 200)
    }

    return (
        <div className={styles.container}>
            <Head>
                <title> Meu painel de tarefas </title>
            </Head>
            
            <main className={styles.main}>
                <section className={styles.content}>
                    <div className={styles.contentForm}>
                        <h1 className={styles.title}>Qual a sua tarefa?</h1>

                        <form onSubmit={handleRegisterTask}>
                            <Textarea 
                                placeholder='Digite qual sua tarefa...'
                                value={input}
                                onChange={ (e:ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value) }
                            />
                            
                            <div className={styles.checkboxArea}>
                                <input 
                                    type="checkbox" 
                                    className={styles.checkbox}
                                    checked={publicTask}
                                    onChange={ handleChangePublic }
                                />
                                <label>Deixar tarefa pública</label>
                            </div>

                            <button type='submit' className={styles.button}>
                                Registrar
                            </button>
                        </form>
                        
                    </div>
                </section>
                <section className={styles.taskContainer}>
                    
                    <h1>Minhas Tarefas</h1>

                    {tasks.map( (item) => (
                        <article className={styles.task} key={item.id}>
                            {item.public && (
                                <div className={styles.tagContainer}>
                                    <label className={styles.tag}>PÚBLICO</label>
                                    <button className={styles.shareButton} onClick={ () => setShareTask(item) }>
                                        <FaShare
                                            size={22}
                                            color='#3182FF'
                                        />
                                    </button>
                                </div>
                            )}

                            <div className={styles.taskContent}>

                                {item.public ? (
                                    <Link href={`/task/${item.id}`}>
                                        <p>{item.tarefa}</p>
                                    </Link>
                                ) : (
                                    <p>{item.tarefa}</p>
                                )}
                                
                                <button className={styles.trash} onClick={ () => handleDeleteTask(item.id) }>
                                    <FaTrash 
                                        size={24}
                                        color='#EA3140'
                                    />
                                </button>
                            </div>
                        </article>
                    ))}

                </section>
            </main>
            
            {shareTask && (
                <div 
                    className={`${styles.shareModalOverlay} ${isClosing ? styles.fadeOut : styles.fadeIn}`}
                    onClick={closeModal}
                >
                    <div 
                        className={`${styles.shareModal} ${isClosing ? styles.scaleOut : styles.scaleIn}`}
                        onClick={ (e) => e.stopPropagation() }
                    >
                        <button
                            className={styles.closeModal}
                            onClick={closeModal}
                        >
                            <FiX size={22}/>
                        </button>
                        
                        <h2>Compartilhar tarefa</h2>

                        <button onClick={() => shareEmail(shareTask)} className={styles.iconButton}> Email <TfiEmail size={18}/></button>
                        <button onClick={() => shareNative(shareTask)} className={styles.iconButton}> Compartilhar <FiShare2 size={20}/></button>
                        <button onClick={() => shareWhatsApp(shareTask)} className={styles.iconButton}> WhatsApp <FaWhatsapp size={20}/></button>
                        <button onClick={() => copyLink(shareTask)} className={styles.iconButton}> Copiar link <FiLink size={18}/></button>

                    </div>
                </div>
            )}
            
        </div>
        
    );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const session = await getSession({ req });

    if(!session?.user) {
        // redirecione para o home
        return {
            redirect: {
                destination: '/',
                permanent: false,
            }
        }
    }
    
    return {
        props: {
            user: {
                email: session?.user?.email,
            }
        },
    }
    
}