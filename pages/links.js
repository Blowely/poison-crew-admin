import Layout from "@/components/Layout";
import Link from "next/link";
import {useCallback, useEffect, useMemo, useState} from "react";
import axios from "axios";
import {CopyOutlined, LinkOutlined, LoadingOutlined} from "@ant-design/icons";
import {Button, Input, Modal, notification, Pagination, Select} from "antd";
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


  const buildRequest = useCallback(() => {
    const obj = {
      limit: 1,
      offset: offset,
      token,
      type: 'admin',
    }

    if (collName) {
      obj.collName = collName
    }

    return obj;
  }, [offset, collName])

  useEffect(() => {
    axios.get(customUrlBuilder('/api/productsV3', buildRequest())).then(response => {
      const data = response.data?.items.map(({_id}) => _id).join(',');
      localStorage.setItem('productsList', data);
      setProducts(response.data);
      setLoading(false);
    });
  }, [offset, lsOffset, collName]);


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

  const onPaginationChange = (page, src) => {
    const body = {
      value: src,
    }

    const options = {
      method: 'POST',
      url: `/api/log?value=${src}`,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    axios(options).catch(console.log);
    const value = page * 1 - 1;
    setOffset(value);
    localStorage.setItem('offset', value.toString());
    localStorage.setItem('page', page.toString());
  }

  const getSrcEnding = (src) => {
    const parts = src.split('/');
    return parts[parts.length - 1];
  }

  return (
    <Layout>
      {isLoading &&
        <div className="w-screen h-screen flex justify-center items-center absolute">
          Sizes and costs recognizing... <LoadingOutlined style={{fontSize: '24px'}} spin />
        </div>
      }

      {!isLoading &&
        <>
          <table className="basic mt-2">
            <tbody>
            {products.items?.map(product => (
              <tr key={product._id} className="flex items-center justify-start gap-2">
                <td style={{paddingLeft: '0px', paddingRight: 0}}
                    onClick={() => onPaginationChange(Number(lsCurrentPage) + 1, product.src)}
                    onBlur={() => onPaginationChange(Number(lsCurrentPage) + 1, product.src)}
                >
                  <a href={`${product.src}`} style={{paddingLeft: 0}} target="_blank">
                    {getSrcEnding(product.src)}
                  </a>
                </td>
                <td style={{paddingLeft: '0px', paddingRight: 0}}
                    onClick={() => onPaginationChange(Number(lsCurrentPage) + 1, product.src)}
                >
                  <Input onFocus={() => onPaginationChange(Number(lsCurrentPage) + 1, product.src)}>
                  </Input>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
          <Pagination
            current={Number(lsCurrentPage)}
            total={products.total_count}
            defaultPageSize={1}
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