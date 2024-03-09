import Layout from "@/components/Layout";
import Link from "next/link";
import {useCallback, useEffect, useMemo, useState} from "react";
import axios from "axios";
import {CopyOutlined, LinkOutlined, LoadingOutlined} from "@ant-design/icons";
import {notification, Pagination, Select} from "antd";
import {customUrlBuilder} from "@/common/utils";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import TextArea from "antd/lib/input/TextArea";

export default function Addlink() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = new URLSearchParams(useSearchParams());

  const [products,setProducts] = useState([]);
  const [src,setSrc] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [sizes, setSizes] = useState([]);
  const [cheapestPrice, setCheapestPrice] = useState(null);
  const [editedProduct, setEditedProduct] = useState({});

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
      limit: 13,
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
    axios.get(customUrlBuilder('/api/productsV2', buildRequest())).then(response => {
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

  const onChangeSrc = (message) => {
    if (message?.length === 0) {
      return setSrc('');
    }


    const messageParts = message.split(' ');
    const productLink = messageParts[5];
    let rightSideOfMessage = '';

    for (let i = 6; i < messageParts.length; i++) {
      rightSideOfMessage += `${messageParts[i]} `;
    }

    const partsOfRightSideOfMessage = rightSideOfMessage.split(',');
    const titleDescription = partsOfRightSideOfMessage[0];

    const payload = {src:productLink, titleDescription}

    if (productLink?.length !== 0) {
      axios.post("http://localhost:3000/api/productsV2", payload)
          .then((res) => {
            notification.success({message: `${productLink} добавлен`})
          }).catch((err) => {
            notification.error({message: `${productLink} не добавлен`})
          })

    }
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

          <TextArea
            placeholder="src"
            value={src}
            onChange={ev => onChangeSrc(ev.target.value)}
          />
        </>
      }
    </Layout>
  );
}