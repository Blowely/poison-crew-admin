import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/router";
import axios from "axios";
import Spinner from "@/components/Spinner";
import {ReactSortable} from "react-sortablejs";
import {DeleteOutlined, LoadingOutlined} from "@ant-design/icons";
import {Button, Layout, Modal, notification} from "antd";
import Link from "next/link";

export default function ProductForm({
  isLoading,
  setLoading,
  getProduct,
  finalData
}) {

  const [title,setTitle] = useState('');
  const [_id,setId] = useState('');
  const [description,setDescription] = useState('');
  const [category,setCategory] = useState('');
  const [productProperties,setProductProperties] = useState({});
  const [price,setPrice] = useState('');
  const [src, setSrc] = useState('');
  const [images,setImages] = useState([]);
  const [goToProducts,setGoToProducts] = useState(false);
  const [isUploading,setIsUploading] = useState(false);
  const [categories,setCategories] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [cheapestPrice, setCheapestPrice] = useState(null);

  let productList;
  let currentElIndex;
  const [isEditTitle, setEditTitle] = useState(false);

  if (typeof window !== 'undefined') {
    if (window.location.href.includes('new')) {
      setEditTitle(true);
    }
    const lsProductList = localStorage.getItem('productsList');
    productList = lsProductList.split(',');
    currentElIndex = productList.indexOf(_id);
  }

  const router = useRouter();

  useEffect(() => {
    setId(finalData?._id || '');
    setTitle(finalData?.title || '');
    setDescription(finalData?.description || '');
    setCategory(finalData?.category || '');
    setPrice(finalData?.price || '');
    setSrc(finalData?.src || '');
    setImages(finalData?.images || '');
    setProductProperties(finalData?.properties || {});
    if (setLoading) {
      setLoading(false);
    }
  },[finalData])

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
        await axios.put('/api/products', {_id, ...data});
      } else {
        //create
        await axios.post('/api/products', data);
      }

      notification.success({message: 'Updated', duration: 2});

      const submitterId = ev.nativeEvent.submitter.id
      const query = localStorage.getItem('collName') || '';

      let url = `/products${query}`;

      if (submitterId === 'savePrev') {
        const prevEl = productList[currentElIndex - 1] || null;
        url = prevEl ? `/products/edit/${prevEl}` : `/products${query}`;
      }

      if (submitterId === 'saveNext') {
        const nextEl = productList[currentElIndex + 1] || null;
        url = nextEl ? `/products/edit/${nextEl}` : `/products${query}`;
      }

      await router.push(url);
    } catch (e) {
      notification.error({message: 'Error', duration: 2});
    }
  }

  async function saveModalProduct() {
    const data = {
      _id,
      title,
      description,
      src,
      images,
      category,
      price: cheapestPrice,
      properties: {
        ...productProperties,
        sizes
      }
    }
    if (_id) {
      //update
      await axios.put('/api/products', data);
    } else {
      //create
      await axios.post('/api/products', data);
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
    setLoading(true);
    const files = ev.target?.files;
    if (files?.length > 0) {
      const data = new FormData();
      for (const file of files) {
        data.append('file', file);
      }
      const res = await axios.post('/api/recognize', data);

      if (res.statusText !== 'OK' && res.status !== 200) {
        return null;
      }
      setLoading(false);
      setModalOpen(true);
      setSizes(res?.data?.items);
      setCheapestPrice(res?.data?.cheapest_price);
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

  const onChangeSrc = (_src) => {
    if (_src?.length === 0) {
      return setSrc('');
    }

    const arr = _src.split(' ');
    if (arr?.length !== 0) {
      setSrc(arr[4]);
    }
  }

  return (
    <Layout>
      <Modal
        title="Sizes and costs"
        okText="Save"
        centered
        open={modalOpen}
        onOk={async () => {
          await saveModalProduct();
          await getProduct();
          setModalOpen(false)
        }}
        onCancel={() => setModalOpen(false)}
      >
        {sizes?.map((el, index) => (
          <p key={index} style={{fontSize:'15px'}}>{el.size}: {el.price}</p>
        ))}
      </Modal>
      <Link className="btn-primary" href={'/products/new'}>Add new product</Link>
      {isLoading &&
        <div className="w-screen h-screen flex justify-center items-center absolute">
          Sizes and costs recognizing... <LoadingOutlined style={{fontSize: '24px'}} spin />
        </div>
      }
      {!isLoading &&
        <form onSubmit={saveProduct}>
          <label>Product name</label>
          <h2 style={{fontSize: '20px'}}>{title}</h2>
          <div className="flex">
            <input
              id="titleInput"
              type="text"
              placeholder="product name"
              value={title}
              disabled={!isEditTitle}
              onChange={ev => setTitle(ev.target.value)}
            />
            <Button onClick={() => setEditTitle(true)}>edit</Button>
          </div>
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
                      {(productProperties?.[p.name])?.map((el,i) => (
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
                Poizon
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
            onChange={ev => onChangeSrc(ev.target.value)}
          />
          <div className="flex flex-unwrap gap-4 mt-5">
            <div style={{width:'100%'}}>
              <button className="btn-primary w-full" id="savePrev">
                {'<- Save'}
              </button>
            </div>
            <div style={{width:'100%'}}>
              <button className="btn-primary w-full" id="save">
                Save
              </button>
            </div>
            <div style={{width:'100%'}}>
              <button className="btn-primary w-full" id="saveNext">
                {'Save ->'}
              </button>
            </div>
          </div>

        </form>
      }
    </Layout>

  );
}
