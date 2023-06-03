import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import axios from "axios";
import Spinner from "@/components/Spinner";
import {ReactSortable} from "react-sortablejs";
import {DeleteOutlined} from "@ant-design/icons";
import {notification} from "antd";

export default function ProductForm({
  _id,
  title:existingTitle,
  description:existingDescription,
  price:existingPrice,
  src: existingSrc,
  images:existingImages,
  category:assignedCategory,
  properties:assignedProperties,
}) {
  const [title,setTitle] = useState(existingTitle || '');
  const [description,setDescription] = useState(existingDescription || '');
  const [category,setCategory] = useState(assignedCategory || '');
  const [productProperties,setProductProperties] = useState(assignedProperties || {});
  const [price,setPrice] = useState(existingPrice || '');
  const [src, setSrc] = useState(existingSrc || '');
  const [images,setImages] = useState(existingImages || []);
  const [goToProducts,setGoToProducts] = useState(false);
  const [isUploading,setIsUploading] = useState(false);
  const [categories,setCategories] = useState([]);
  const router = useRouter();
  useEffect(() => {
    axios.get('/api/categories').then(result => {
      setCategories(result.data);
    })
  }, []);
  async function saveProduct(ev) {
    try {
      ev.preventDefault();
      const data = {
        title,description,price,src,images,category,
        properties:productProperties
      };
      if (_id) {
        //update
        await axios.put('/api/products', {...data,_id});
      } else {
        //create
        await axios.post('/api/products', data);
      }

      notification.success({message: 'Updated', duration: 2});
      router.push('/products');
    } catch (e) {
      notification.error({message: 'Error', duration: 2});
    }


  }
  if (goToProducts) {
    router.push('/products');
  }
  async function uploadImages(ev) {
    const files = ev.target?.files;
    if (files?.length > 0) {
      setIsUploading(true);
      const data = new FormData();
      for (const file of files) {
        data.append('file', file);
      }
      const res = await axios.post('/api/upload', data);
      setImages(oldImages => {
        return [...oldImages, ...res.data.links];
      });
      setIsUploading(false);
    }
  }

  async function uploadPoisonImg(ev) {
    const files = ev.target?.files;
    if (files?.length > 0) {
      setIsUploading(true);
      const data = new FormData();
      for (const file of files) {
        data.append('file', file);
      }
      const res = await axios.post('/api/recognize', data);

      setIsUploading(false);
    }
  }

  function updateImagesOrder(images) {
    setImages(images);
  }

  function deleteImage(el,index) {
    setImages((prev) => prev.filter((el, i) => i !== index));
  }

  function setProductProp(propName,value, i, field) {
    setProductProperties(prev => {
      const newProductProps = {...prev};
      if (i >= 0) {
        newProductProps[propName][i][field] = value;
      } else {
        newProductProps[propName] = value;
      }

      return newProductProps;
    });
  }

  const propertiesToFill = [];
  if (categories.length > 0 && category) {
    let catInfo = categories.find(({_id}) => _id === category);
    propertiesToFill.push(...catInfo.properties);
    while(catInfo?.parent?._id) {
      const parentCat = categories.find(({_id}) => _id === catInfo?.parent?._id);
      propertiesToFill.push(...parentCat.properties);
      catInfo = parentCat;
    }
  }

  return (
      <form onSubmit={saveProduct}>
        <label>Product name</label>
        <input
          type="text"
          placeholder="product name"
          value={title}
          onChange={ev => setTitle(ev.target.value)}/>
        <label>Category</label>
        <select value={category}
                onChange={ev => setCategory(ev.target.value)}>
          <option value="">Uncategorized</option>
          {categories.length > 0 && categories.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        {propertiesToFill.length > 0 && propertiesToFill.map(p => {
          if (p.name === 'sizes') {
            return (
              <div key={p.name} >
                <label>{p.name[0].toUpperCase()+p.name.substring(1)}</label>
                <div>
                  <ul>
                    {productProperties[p.name]?.map((el,i) => (
                      <li key={i}>
                        <span>{el.size}: <input type="text" style={{width: '100px'}} value={el.price} onChange={ev =>{
                          setProductProp(p.name,ev.target.value, i, 'price')
                        }}/> CNY</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          }

          return (
            <div key={p.name} className="">
              <label>{p.name[0].toUpperCase()+p.name.substring(1)}</label>
              <div>
                <select value={productProperties[p.name]}
                        onChange={ev =>
                          setProductProp(p.name,ev.target.value)
                        }
                >
                  {p.values.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          )
        })}
        <label>
          Photos
        </label>
        <div className="mb-2 flex flex-wrap gap-1">
          <ReactSortable
            list={images}
            className="flex flex-wrap gap-1"
            setList={updateImagesOrder}>
            {!!images?.length && images.map((link,i) => (
              <div key={i} className="flex flex-col">
                <div key={link} className="h-24 bg-white relative p-4 shadow-sm rounded-sm border border-gray-200">
                  <img src={link} alt="" className="rounded-lg z-10 relative"/>
                </div>
                <button className="bg-red-500" onClick={(el) => deleteImage(el, i)}><DeleteOutlined /></button>
              </div>

            ))}
          </ReactSortable>
          {isUploading && (
            <div className="h-24 flex items-center">
              <Spinner />
            </div>
          )}
          <label className="w-24 h-24 cursor-pointer text-center flex flex-col items-center justify-center text-sm gap-1 text-primary rounded-sm bg-white shadow-sm border border-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div>
              Add image
            </div>
            <input type="file" onChange={uploadImages} className="hidden"/>
          </label>
          <label className="w-24 h-24 cursor-pointer text-center flex flex-col items-center justify-center text-sm gap-1 text-primary rounded-sm bg-white shadow-sm border border-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <div>
              Upload Poizon image
            </div>
            <input type="file" onChange={uploadPoisonImg} className="hidden"/>
          </label>
        </div>
        <label>Description</label>
        <textarea
          placeholder="description"
          value={description}
          onChange={ev => setDescription(ev.target.value)}
        />
        <label>Price (in CNY)</label>
        <input
          type="number" placeholder="price"
          value={price}
          onChange={ev => setPrice(ev.target.value)}
        />
        <label>Poizon src</label>
        <input
          placeholder="src"
          value={src}
          onChange={ev => setSrc(ev.target.value)}
        />
        <button
          type="submit"
          className="btn-primary">
          Save
        </button>
      </form>
  );
}
