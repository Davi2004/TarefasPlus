import { GetServerSideProps } from 'next';
import styles from './style.module.css'
import Head from 'next/head'
import { useState, ChangeEvent, FormEvent } from 'react'
import { useSession } from 'next-auth/react'

import { db } from '../../services/firebaseConnection'
import { doc, collection, query, where, getDoc, addDoc, getDocs, deleteDoc } from 'firebase/firestore'

import { FaTrash } from 'react-icons/fa'

import { Textarea } from '../../components/textArea'
import Image from 'next/image';

import toast from 'react-hot-toast';

interface TaskProps {
    item: {
        tarefa: string,
        created: string,
        public: boolean,
        user: string,
        taskId: string
    };
    allComments: CommentProps[]
}

interface CommentProps {
    id: string,
    comment: string,
    taskId: string,
    user: string,
    name: string,
    profilePhoto?: string | null,
}

export default function task({ item, allComments }: TaskProps) {
    const { data: session } = useSession()
    const [input, setInput] = useState("")
    const [comments, setComments] = useState<CommentProps[]>(allComments || [])
        
    async function handleRegisterComment(event: FormEvent) {
        event.preventDefault();

        if(input === "") {
            toast("ALERTA! O campo precisa ser preenchido!!", {
                icon: '⚠️',
            });
            return;
        }

        if(!session?.user?.email || !session?.user?.name) return;

        try {

            const docRef = await addDoc(collection(db, "comments"), {
                comment: input,
                created: new Date(),
                user: session?.user?.email,
                name: session?.user?.name,
                profilePhoto: session?.user?.image,
                taskId: item?.taskId,
            });
            
            const data = {
                id: docRef.id,
                comment: input, 
                user: session?.user?.email,
                name: session?.user?.name,
                profilePhoto: session?.user?.image,
                taskId: item?.taskId
            };

            setComments((oldItems) => [...oldItems, data])
            toast.success("Comentário concluído com sucesso!")

            setInput("")
            
        } catch(err) {
            console.log(err);
        }
    }

    async function handleDeleteComment(id: string) {
        try {
            const docRef = doc(db, "comments", id)
            await deleteDoc(docRef);

            const deleteComment = comments.filter((item) => item.id !== id)

            setComments(deleteComment)
            toast.success("Comentário excluído com sucesso!")
            
        } catch(err) {
            console.log(err)
        }
    } 
    
    return (
        <div className={styles.container}>
            <Head>
                <title>Detalhes da Tarefa</title>
            </Head>

            <main className={styles.main}>

                <h1>Tarefa</h1>

                <article className={styles.task}>
                    <p>
                        {item.tarefa}
                    </p>
                </article>
                
            </main>

            <section className={styles.commentsContainer}>
                <h2>Deixe seu comentário.</h2>
                
                <form onSubmit={handleRegisterComment}>
                    <Textarea
                        placeholder='Digite seu comentário...'
                        value={input}
                        onChange={ (e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value) }
                    />
                    <button className={styles.button} disabled={!session?.user}>
                        Enviar comentário
                    </button>
                </form>
                
            </section>

            <section className={styles.commentsContainer}>
                <h2>Comentários:</h2>

                {comments.length === 0 && (
                    <span className={styles.span}>Nenhum comentário foi encontrado...</span>
                ) }

                {comments.map( (item) => (
                    <article className={styles.comment} key={item.id}>
                        <div className={styles.headComment}>
                            <div className={styles.userProfile}>
                                {item?.profilePhoto && (
                                    <Image
                                        src={item?.profilePhoto}
                                        alt='Foto de perfil'
                                        width={40}
                                        height={40}
                                        className={styles.avatar}
                                    />
                                )}
                                <label className={styles.commentsLabel}>{item.name}</label>
                            </div>
                            {item.user === session?.user?.email && (
                                <button 
                                    className={styles.buttonTrash}
                                    onClick={() => handleDeleteComment(item.id)}
                                >
                                    <FaTrash
                                        size={18}
                                        color='#EA3140'
                                    />
                                </button>
                            )}
                        </div>
                        <p>{item.comment}</p>
                    </article>
                ) )}

            </section>
            
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {

    const id = params?.id as string;

    const q = query(
        collection(db, "comments"), 
        where("taskId", "==", id),
    )
    const docRef = doc(db, "tarefas", id)

    const snapshotComments = await getDocs(q);
    const snapshot = await getDoc(docRef);

    let allComments: CommentProps[] = [];
    snapshotComments.forEach( (doc) => {
        allComments.push({
            id: doc.id,
            comment: doc.data().comment,
            user: doc.data().user,
            name: doc.data().name,
            taskId: doc.data().taskId,
            profilePhoto: doc.data().profilePhoto
        })
    } )

    if(snapshot.data() === undefined) {
        return {
            redirect: {
                destination: "/dashboard",
                permanent: false
            }
        }
    }

    if(!snapshot.data()?.public) {
        return {
            redirect: {
                destination: "/dashboard",
                permanent: false
            }
        }
    }

    const miliseconds = snapshot.data()?.created?.seconds * 1000

    const task = {
        tarefa: snapshot.data()?.tarefa,
        public: snapshot.data()?.public,
        created: new Date(miliseconds).toLocaleDateString(),
        user: snapshot.data()?.user,
        taskId: id,
    }

    return {
        props: {
            item: task,
            allComments: allComments,
        }
    }

}