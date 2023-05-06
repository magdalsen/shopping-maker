import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";
import LoginDataWrapper from "./LoginDataWrapper"
import List from "./pages/List";
import style from './MyLists.module.css';
import { Link } from "react-router-dom";
import { useUserContext } from "../contexts/UserContext";
import { useEffect } from "react";

const ToDo = () => {
    const {id}=useUserContext();
    const queryClient = useQueryClient();
    const fetchToDoLists = async () => {
        const { data, error } = await supabase
        .from('lists')
        .select()
        .match({
            contractorId: id,
            archived: false
        })
        if (error) throw error;
        return data;
    }
    const {data:lists, isLoading, error}=useQuery(["listsToDo",id],fetchToDoLists);

    const mutation = useMutation(async ()=>await fetchToDoLists(), {
        onSuccess: () => {
          queryClient.invalidateQueries(['listsToDo',id]);
        },
        onError: ()=>{
          throw new Error("Something went wrong :(");
        }
    });

    useEffect(() => {
        mutation.mutate();
      }, []);

    if (error) {
        <div>Sorry, error!</div>
    }
    if (isLoading) {
        <div>Loading data...</div>
    }

    return (
        <LoginDataWrapper>
                <div className={style.listsBox}>
                    {lists?.map((values)=>(
                        <Link to={`/todo/listdetails/${values.id}`} key={values.id}>
                            <div key={values.id}>
                                <List {...values} />
                            </div>
                        </Link>
                    ))}
                </div>
        </LoginDataWrapper>
    )
}

export default ToDo