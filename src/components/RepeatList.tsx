import { useEffect, useState } from "react";
import { Control,useFieldArray, useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { Button, FormLabel, Input, Select, Table, TableCaption, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";

import { useNotificationContext } from "../contexts/NotificationContext";
import { useUserContext } from "../contexts/UserContext";
import { supabase } from "../supabaseClient";

import { schemaAddList } from "./validations/validation";
import LoginDataWrapper from "./LoginDataWrapper";

import style from './AddList.module.css';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Products {
    name: string;
    price: number;
    amount: number;
    unit: string;
}

export interface FormValues {
  products: Products[];
  listName: string;
  receiveDate: Date;
  address: string;
  estimatedCost: number;
  tip: number;
  phone: string;
  id: number;
  ownerId: number;
  contractorId: string;
}

const RepeatList = () => {
  const {id}=useUserContext();
  const {toggleAlertSuccess}=useNotificationContext();
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listId = useParams();

  const fetchListData = async () => {
    const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('id', listId.id);
    if (error) throw error;
    return data[0];
  }
  const {data:list,isLoading,error}=useQuery(['listRepeat',id],fetchListData);

  const mutation = useMutation(async ()=>await fetchListData(), {
    onSuccess: () => {
      queryClient.invalidateQueries(['listRepeat',id]);
    },
    onError: ()=>{
      throw new Error("Something went wrong :(");
    }
});

useEffect(()=>{
    mutation.mutate();
    fetchListData().then(()=>{
        setValue('products', list?.products);
        setValue('listName', list?.listName);
        setValue('receiveDate', list?.receiveDate);
        setValue('address', list?.address);
        setValue('phone', list?.phone);
    })
},[]);

  const Total = ({ control }: { control: Control<FormValues> }) => {
      const formValues = useWatch({
        name: "products",
        control
      });
      const formValues2 = useWatch({
        name: "tip",
        control
      });
      const total = formValues.reduce(
        (acc, current) => acc + (current.price || 0) * (current.amount || 0),
        0
      );
      const total2 = (total*formValues2/100)+total
      setTotalPrice(total);
      return <>
        <div>Szacowana wartość bez napiwku: {total} zł</div>
        <div>Szacowana wartość z napiwkiem: {total2} zł</div>
      </>;
  };

  const repeatList = async (values:FormValues) => {
    const { data:userCity, error:errorCity } = await supabase
    .from('users')
    .select('*')
    .eq('id', id);
    if (errorCity) throw errorCity;
    const { data, error } = await supabase
    .from('lists')
    .insert([
      { ...values, estimatedCost: totalPrice, ownerId: id, city: userCity[0].city, confirmed: false, approved: false, inprogress: false }
    ])
    if (error) throw error;
    return data;
  }
      
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<FormValues>({
    defaultValues: {
      products: list?.products.map((el: { name: string; amount: string; price: string; unit: string; })=>{
        return [{ name: el?.name, amount: el?.amount, price: el?.price, unit: el?.unit }]
      }),
      listName: list?.listName,
      receiveDate: list?.receiveDate,
      address: list?.address,
      tip: list?.tip,
      phone: list?.phone
    },
    resolver: yupResolver(schemaAddList),
    mode: "onBlur"
  });
  const { fields, append, remove } = useFieldArray({
    name: "products",
    control
  });
  const onSubmit = (data: FormValues) => {
    repeatList(data);
    toggleAlertSuccess('Lista dodana!');
    navigate("/taskcompleted", { replace: true });
  };

  if(error){
    return <p>Cannot get data</p>
  }

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <LoginDataWrapper>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={style.form}>
            <div className={style.leftColumn}>
                <FormLabel display="flex" justifyContent="center">Nazwa listy</FormLabel>
                <Input {...register("listName")} type="text" placeholder="Nazwa listy" htmlSize={20} width='auto' />
                <p>{errors.listName?.message}</p>
                <TableContainer>
                  <Table variant='striped' colorScheme='teal' className={style.table}>
                  <TableCaption><Total control={control} /></TableCaption>
                    <Thead>
                      <Tr>
                        <Th>Produkt</Th>
                        <Th>Ilość</Th>
                        <Th minWidth={160}>Jednostka</Th>
                        <Th>Cena</Th>
                        <Th>Usuń</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                    {fields.map((field, index) => (
                    <>
                    <Tr key={field.id}>
                        <Td><Input {...register(`products.${index}.name` as const)} type="text" placeholder="Produkt" /></Td>
                        <Td><Input {...register(`products.${index}.amount` as const)} type="number" placeholder="Ilość" /></Td>
                        <Td><Select
                          placeholder="Wybierz"
                          {...register(`products.${index}.unit` as const)}
                        >
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="szt">szt</option>
                          <option value="l">l</option>
                          <option value="ml">ml</option>
                        </Select></Td>
                        <Td><Input {...register(`products.${index}.price` as const)} type="number" placeholder="Cena" /></Td>
                        <Td onClick={() => remove(index)}>Usuń</Td>
                    </Tr>
                    <Tr>
                      <Td><p>{errors?.products?.[index]?.name?.message}</p></Td>
                      <Td><p>{errors?.products?.[index]?.amount?.message}</p></Td>
                      <Td><p>{errors?.products?.[index]?.unit?.message}</p></Td>
                      <Td><p>{errors?.products?.[index]?.price?.message}</p></Td>
                      <Td></Td>
                    </Tr>
                    </>
                ))}
                    </Tbody>
                  </Table>
                </TableContainer>
                <Button
                  type="button"
                  onClick={() =>
                      append({
                      name: "",
                      amount: 0,
                      price: 0,
                      unit: ""
                      })
                  }
                  >
                  Dodaj produkt
                </Button>
            </div>
            <div className={style.rightColumn}>            
                <FormLabel display="flex" justifyContent="center">Napiwek w %</FormLabel>
                <Input {...register("tip")} type="number" htmlSize={20} width='auto' />
                <p>{errors.tip?.message}</p>
                <FormLabel display="flex" justifyContent="center">Termin dostarczenia</FormLabel>
                <Input {...register("receiveDate")} type="date" htmlSize={20} width='auto' />
                <p>{errors.receiveDate?.message}</p>
                <FormLabel display="flex" justifyContent="center">Adres dostarczenia</FormLabel>
                <Input {...register("address")} type="text" placeholder="np. ul. Jasna 5" htmlSize={20} width='auto' />
                <p>{errors.address?.message}</p>
                <FormLabel display="flex" justifyContent="center">Telefon kontaktowy</FormLabel>
                <Input {...register("phone")} type="text" placeholder="Telefon" htmlSize={20} width='auto' />
                <p>{errors.phone?.message}</p>
            </div>
        </div>
        <Button colorScheme='blue' type="submit">Utwórz ponownie</Button>
      </form>
    </LoginDataWrapper>
  );
}

export default RepeatList