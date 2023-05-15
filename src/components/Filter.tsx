import { useState } from 'react'
import { supabase } from '../supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import List from './pages/List';
import style from './MyLists.module.css';
import { Checkbox, FormLabel, Input } from '@chakra-ui/react';
import { useDebounce } from './helpers/useDebounce';

const Filter = () => {
    const [filterTags, setFilterTags] = useState<string[]>([]);
    const [searchCity, setSearchCity]=useState("");
    const [searchAddress, setSearchAddress]=useState("");
    const [searchListName, setListName]=useState("");
    const [searchReceiveDate, setReceiveDate]=useState("");
    const fetchAll = async (city="",address="",listName="",receiveDate="") => {
      const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('archived', false)
      .eq('confirmed', false)
      .ilike("city", `%${city}%`)
      .ilike("address", `%${address}%`)
      .ilike("listName", `%${listName}%`)
      .ilike("receiveDate", `%${receiveDate}%`)
      if (error) throw error;
      return data;
    }
    const {data:allListsFilter, isLoading, error}=useQuery(["allListsFilter",searchCity,searchAddress,searchListName,searchReceiveDate],
      async ()=>await fetchAll(searchCity,searchAddress,searchListName,searchReceiveDate));

  const filteredDATA = allListsFilter?.filter((el) =>
    filterTags.length > 0
      ? filterTags.map((filterTag:string) => filterTag).includes(el.city) ||
        filterTags.map((filterTag:string) => filterTag).includes(el.address) || 
        filterTags.map((filterTag:string) => filterTag).includes(el.listName) || 
        filterTags.map((filterTag:string) => filterTag).includes(el.receiveDate)
      : allListsFilter
  )

  const filterHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setFilterTags([...filterTags, event.target.value])
    } else {
      setFilterTags(
        filterTags.filter((filterTag) => filterTag !== event.target.value)
      )
    }
  }

  const changeCity=useDebounce((e:React.ChangeEvent<HTMLInputElement>)=>{
    setSearchCity(e.target.value)
  },700);
  const changeAddress=useDebounce((e:React.ChangeEvent<HTMLInputElement>)=>{
    setSearchAddress(e.target.value)
  },700);
  const changeListName=useDebounce((e:React.ChangeEvent<HTMLInputElement>)=>{
    setListName(e.target.value)
  },700);
  const changeReceiveDate=useDebounce((e:React.ChangeEvent<HTMLInputElement>)=>{
    setReceiveDate(e.target.value)
  },700);

  const newCityArray:string[] = [];
  const newAddressArray:string[] = [];
  const newNameArray:string[] = [];
  const newDateArray:string[] = [];
    const cityArray = () => {
      return allListsFilter?.map((el)=>{
          return newCityArray.push(el.city)
      })
    }
    const addressArray = () => {
      return allListsFilter?.map((el)=>{
          return newAddressArray.push(el.address)
      })
    }
    const nameArray = () => {
      return allListsFilter?.map((el)=>{
          return newNameArray.push(el.listName)
      })
    }
    const dateArray = () => {
      return allListsFilter?.map((el)=>{
          return newDateArray.push(el.receiveDate)
      })
    }
    cityArray();
    addressArray();
    nameArray();
    dateArray();
    let newSetCity = [...new Set(newCityArray)];
    let newSetAddress = [...new Set(newAddressArray)];
    let newSetName = [...new Set(newNameArray)];
    let newSetDate = [...new Set(newDateArray)];

  if (error) {
    <div>Sorry, error!</div>
  }
  if (isLoading) {
      <div>Loading data...</div>
  }

  return (
    <div className={style.main}>
      <div className={style.leftColumn}>
        <h3>Filtry</h3>
        <h3>Miasto:</h3>
        <Input onChange={changeCity} name="city" placeholder="Wpisz miasto" />
        {newSetCity?.map((el)=>(
            <FormLabel htmlFor={el} key={el}>
                <Checkbox
                    onChange={filterHandler}
                    value={el}
                    id={el}
                />
                <span>{el}</span>
            </FormLabel>
        ))}

        <h3>Adres dostarczenia:</h3>
        <Input onChange={changeAddress} name="address" placeholder="Wpisz adres" />
        {newSetAddress?.map((el)=>(
            <FormLabel htmlFor={el} key={el}>
                <Checkbox
                    onChange={filterHandler}
                    value={el}
                    id={el}
                />
                <span>{el}</span>
            </FormLabel>
        ))}

        <h3>Nazwa Listy:</h3>
        <Input onChange={changeListName} name="listName" placeholder="Wpisz nazwę" />
        {newSetName?.map((el)=>(
            <FormLabel htmlFor={el} key={el}>
                <Checkbox
                    type="checkbox"
                    onChange={filterHandler}
                    value={el}
                    id={el}
                />
                <span>{el}</span>
            </FormLabel>
        ))}

        <h3>Data dostarczenia:</h3>
        <Input onChange={changeReceiveDate} name="receiveDate" placeholder="rrrr-mm-dd" />
        {newSetDate?.map((el)=>(
            <FormLabel htmlFor={el} key={el}>
                <Checkbox
                    type="checkbox"
                    onChange={filterHandler}
                    value={el}
                    id={el}
                />
                <span>{el}</span>
            </FormLabel>
        ))}
      </div>
      <div className={style.rightColumn}>
        <h3>Dostępne listy</h3>
            <div className={style.listsBox}>
                    {filteredDATA?.map((el) => (
                        <div key={el.id}>
                        <Link to={`/listdetails/${el.id}`} key={el.id}>
                            <div key={el.id}>
                                <List {...el} />
                            </div>
                        </Link>
                        </div>
                    ))}
            </div>
      </div>
    </div>
  )
}

export default Filter