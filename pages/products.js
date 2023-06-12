import Layout from "@/components/Layout";
import Link from "next/link";
import {useCallback, useEffect, useMemo, useState} from "react";
import axios from "axios";
import {CopyOutlined, LoadingOutlined} from "@ant-design/icons";
import {Modal, notification, Pagination, Select} from "antd";
import {customUrlBuilder} from "@/common/utils";
import {usePathname, useRouter, useSearchParams} from "next/navigation";

export default function Products() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = new URLSearchParams(useSearchParams());

  const [products,setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [sizes, setSizes] = useState([]);
  const [cheapestPrice, setCheapestPrice] = useState(null);
  const [editedProduct, setEditedProduct] = useState({});
  const [collections, setCollections] = useState([]);
  const [modalImageOpen, setModalImageOpen] = useState(false);

  const collName = searchParams.get('collName');

  let lsOffset = '';
  let lsCurrentPage = '';
  let token = ''
  if (typeof window !== 'undefined') {
    lsOffset = localStorage?.getItem('offset');
    lsCurrentPage = localStorage?.getItem('page');
    token = localStorage?.getItem('token');
    if (!token) {
      localStorage?.setItem('token', 'NzkyMjM5NTU0Mjk6NTcxNA==');
      token = 'NzkyMjM5NTU0Mjk6NTcxNA==';
    }
  }

  const [offset, setOffset] = useState(lsOffset || 0);

  useEffect(() => {
    axios.get('/api/collections').then(response => {
      setCollections(response.data);
      setLoading(false)
    });
  },[]);

  const handledMemoCollections = useMemo(() => {
    const elAllCollections = {label:"all collections", value: ''};
    const handledCollections = collections.map((el, i) => ({
      value: el.name,
      label: `${el.name} ${el.value}`
    }));

    return [elAllCollections, ...handledCollections]
  },[collections]);


  const buildRequest = useCallback(() => {
    const obj = {
      limit: 20,
      offset: offset,
      token,
    }

    if (collName) {
      obj.collName = collName
    }

    return obj;
  }, [offset, collName])

  useEffect(() => {
    axios.get(customUrlBuilder('/api/products', buildRequest())).then(response => {
      const data = response.data?.items.map(({_id}) => _id).join(',');
      localStorage.setItem('productsList', data);
      setProducts(response.data);
      setLoading(false);
    });
  }, [offset, lsOffset, collName]);

  async function getProducts() {
    await axios.get(customUrlBuilder('/api/products', buildRequest())).then(response => {
      setProducts(response.data);
      setLoading(false)
    });

  }

  const onChangeCollection = (name) => {
    searchParams.set('collName', name);
    const search = searchParams.toString();
    const query = search ? `?${search}` : "";
    localStorage.setItem('collName', query);

    router.push(`${pathname}${query}`);
  }

  async function saveProduct(product) {
    if (product._id) {
      //update
      await axios.put('/api/products', {
        ...product,
        price: cheapestPrice,
        properties: {
          ...product.properties,
          sizes: sizes
        }
      }
      );
    } else {
      //create
      await axios.post('/api/products', data);
    }
  }

  async function uploadPoisonImg(ev, product) {
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

      setModalOpen(true);
      setEditedProduct(product);
      setSizes(res?.data?.items);
      setCheapestPrice(res?.data?.cheapest_price);
    }
    setLoading(false);
  }

  const copyToClipboard = (title) => {
    navigator.clipboard.writeText(title)
    notification.success({message: 'Copied', duration: 1})
  }

  const onPaginationChange = (page) => {
    const value = page * 20 - 20;
    setOffset(value);
    localStorage.setItem('offset', value.toString());
    localStorage.setItem('page', page.toString());
  }

  return (
    <Layout>
      <Modal
        title="Sizes and costs"
        okText="Save"
        centered
        open={modalOpen}
        onOk={async () => {
          await saveProduct(editedProduct);
          setModalOpen(false)
          await getProducts();
        }}
        onCancel={() => setModalOpen(false)}
      >
        {sizes.map((el, index) => (
          <p key={index} style={{fontSize:'15px'}}>{el.size}: {el.price}</p>
        ))}
      </Modal>
      <Modal
        centered
        open={!!modalImageOpen}
        onCancel={() => setModalImageOpen(false)}
      >
        <img src={modalImageOpen} alt=""/>
      </Modal>
      <Link className="btn-primary" href={'/products/new'}>Add new product</Link>
      {isLoading &&
        <div className="w-screen h-screen flex justify-center items-center absolute">
          Sizes and costs recognizing... <LoadingOutlined style={{fontSize: '24px'}} spin />
        </div>
      }

      {!isLoading &&
        <>
          <Select options={handledMemoCollections} defaultValue="" value={collName || ""} onChange={onChangeCollection} />
          <table className="basic mt-2">
            <tbody>
            {products.items?.map(product => (
              <tr key={product._id} className="flex items-center justify-between">
                <td style={{paddingLeft: '0px', paddingRight: 0}}>
                  <img style={{height: 'auto', maxWidth: '150px' }} onClick={() => setModalImageOpen(product.images[0])}
                       src={product.images[0]}/>
                </td>
                <td className="h-auto" style={{padding: '0'}}>
                  <tr><td style={{fontSize: '13px'}}>{product.title}</td></tr>
                  <tr><td style={{fontSize: '10px', gap: '1px'}}>
                    {product?.properties?.sizes?.map((s, i) => {
                      if (s.size?.confidence === 0) {return null}
                      return <span key={i} className="bg-blue-400 text-white p-1 mr-1">
                        {s.size}: <span className="bg-cyan-600 text-white">{s.price}</span>
                       </span>
                    }).filter((el, i, arr) => i === 0 || i === arr.length - 1)}
                  </td>
                  </tr>
                  <tr>
                    <td className="flex flex-wrap justify-end gap-1" style={{maxWidth: '180px', maxHeight: '130px', fontSize: '10px'}} >
                      <tr className="flex">
                        <Link className="btn-default" href={'/products/edit/'+product._id}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                          Edit
                        </Link>
                        <div className="btn-default w-20 text-center flex items-center gap-1" onClick={() => copyToClipboard(product.title)}>
                          <CopyOutlined />
                          Copy
                        </div>
                      </tr>
                      <tr className="flex">
                        <Link className="btn-red" href={'/products/delete/'+product._id}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" strokeWidth={1.5} stroke="currentColor" className="w-2 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </Link>
                        <label className="w-20 cursor-pointer text-center flex items-center justify-center text-sm gap-1 text-primary rounded-sm bg-white shadow-sm border border-primary">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          <div>
                            Poizon
                          </div>
                          <input type="file" onChange={(ev) => uploadPoisonImg(ev, product)} className="hidden"/>
                        </label>
                      </tr>

                    </td>
                  </tr>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
          <Pagination
            current={Number(lsCurrentPage)}
            total={products.total_count}
            defaultPageSize={20}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `Total ${total} items`}
            onChange={onPaginationChange}
          />
        </>
      }
    </Layout>
  );
}